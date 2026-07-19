import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import * as fs from 'fs';
import * as path from 'path';
import { Setting } from './entities/setting.entity';
import { DictionaryEntry } from './entities/dictionary-entry.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ActivityLogService } from '../activity-logs/activity-log.service';
import { ActivityAction } from '../activity-logs/activity-action.enum';

const SETTINGS_ROW_ID = 1;

@Injectable()
export class SettingsService implements OnModuleInit {
  private cache: Setting | null = null;

  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepo: Repository<Setting>,
    @InjectRepository(DictionaryEntry)
    private readonly dictionaryRepo: Repository<DictionaryEntry>,
    private readonly activityLogService: ActivityLogService,
    private readonly i18n: I18nService,
  ) {}

  async onModuleInit() {
    await this.ensureSettingsRow();
    await this.ensureDictionarySeeded();
  }

  private async ensureSettingsRow() {
    const existing = await this.settingsRepo.findOne({ where: { id: SETTINGS_ROW_ID } });
    if (!existing) {
      const created = this.settingsRepo.create({ id: SETTINGS_ROW_ID });
      this.cache = await this.settingsRepo.save(created);
    } else {
      this.cache = existing;
    }
  }

  private async ensureDictionarySeeded() {
    const count = await this.dictionaryRepo.count();
    if (count > 0) return;

    const seedPath = path.join(__dirname, '../../database/seeds/dictionary.seed.json');
    if (!fs.existsSync(seedPath)) return;

    const raw = fs.readFileSync(seedPath, 'utf-8');
    const entries: { key: string; en: string; ar: string }[] = JSON.parse(raw);
    const rows = entries.map((e) => this.dictionaryRepo.create(e));
    const chunkSize = 100;
    for (let i = 0; i < rows.length; i += chunkSize) {
      await this.dictionaryRepo.save(rows.slice(i, i + chunkSize));
    }
  }

  private async refreshCache(): Promise<Setting> {
    this.cache = await this.settingsRepo.findOneOrFail({ where: { id: SETTINGS_ROW_ID } });
    return this.cache;
  }

  async getSettings(): Promise<Setting> {
    if (this.cache) return this.cache;
    return this.refreshCache();
  }

  async getMaxUploadSizeMb(): Promise<number> {
    const settings = await this.getSettings();
    return settings.maxUploadSizeMb;
  }

  async getMaxUploadSizeBytes(): Promise<number> {
    const mb = await this.getMaxUploadSizeMb();
    return mb * 1024 * 1024;
  }

  async getDictionary(): Promise<DictionaryEntry[]> {
    return this.dictionaryRepo.find({ order: { key: 'ASC' } });
  }

  async updateSettings(
    dto: UpdateSettingsDto,
    files: { logo?: Express.Multer.File; favicon?: Express.Multer.File },
    actor: AuthUser,
  ): Promise<Setting> {
    const settings = await this.settingsRepo.findOneOrFail({ where: { id: SETTINGS_ROW_ID } });

    if (dto.siteName !== undefined) settings.siteName = dto.siteName;
    if (dto.metaTitle !== undefined) settings.metaTitle = dto.metaTitle;
    if (dto.metaDescription !== undefined) settings.metaDescription = dto.metaDescription;
    if (dto.metaKeywords !== undefined) settings.metaKeywords = dto.metaKeywords;
    if (dto.themeColor !== undefined) settings.themeColor = dto.themeColor;
    if (dto.maxUploadSizeMb !== undefined) settings.maxUploadSizeMb = dto.maxUploadSizeMb;

    if (files.logo) {
      settings.logoData = files.logo.buffer;
      settings.logoMime = files.logo.mimetype;
    }
    if (files.favicon) {
      settings.faviconData = files.favicon.buffer;
      settings.faviconMime = files.favicon.mimetype;
    }

    await this.settingsRepo.save(settings);

    if (dto.dictionary && dto.dictionary.length > 0) {
      await this.upsertDictionary(dto.dictionary);
    }

    await this.refreshCache();

    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(actor),
      action: ActivityAction.SETTINGS_UPDATE,
      targetType: 'Settings',
      targetId: SETTINGS_ROW_ID,
      description: await this.i18n.translate('settings.SETTINGS_UPDATE_LOG'),
    });

    return this.cache as Setting;
  }

  async getAssetBlob(
    type: 'logo' | 'favicon',
  ): Promise<{ data: Buffer; mime: string } | null> {
    const dataColumn = type === 'logo' ? 'logoData' : 'faviconData';
    const mimeColumn = type === 'logo' ? 'logoMime' : 'faviconMime';

    const settings = await this.settingsRepo
      .createQueryBuilder('s')
      .addSelect(`s.${dataColumn}`)
      .where('s.id = :id', { id: SETTINGS_ROW_ID })
      .getOne();

    const data = settings?.[dataColumn] as Buffer | undefined;
    if (!settings || !data) {
      return null;
    }
    return { data, mime: (settings[mimeColumn] as string) || 'image/png' };
  }

  private async upsertDictionary(entries: { key: string; en?: string; ar?: string }[]) {
    for (const entry of entries) {
      let row = await this.dictionaryRepo.findOne({ where: { key: entry.key } });
      if (!row) {
        row = this.dictionaryRepo.create({ key: entry.key });
      }
      if (entry.en !== undefined) row.en = entry.en;
      if (entry.ar !== undefined) row.ar = entry.ar;
      await this.dictionaryRepo.save(row);
    }
  }
}