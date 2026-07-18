import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import * as fs from 'fs';
import * as path from 'path';
import { Setting } from './entities/setting.entity';
import { DictionaryEntry } from './entities/dictionary-entry.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsFileStorageService } from './settings-file-storage.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ActivityLogService } from '../activity-logs/activity-log.service';
import { ActivityAction } from '../activity-logs/activity-action.enum';

const SETTINGS_ROW_ID = 1;

@Injectable()
export class SettingsService implements OnModuleInit {
  // Simple in-memory cache — settings change rarely but are read on nearly
  // every request (upload-limit checks, public GET for the header/meta tags),
  // so we avoid a DB round-trip on the hot path and only refresh on writes.
  private cache: Setting | null = null;

  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepo: Repository<Setting>,
    @InjectRepository(DictionaryEntry)
    private readonly dictionaryRepo: Repository<DictionaryEntry>,
    private readonly fileStorage: SettingsFileStorageService,
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
    // Batch insert; chunk to stay well under typical parameter limits.
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
      settings.logoPath = this.fileStorage.saveAsset('logo', files.logo);
    }
    if (files.favicon) {
      settings.faviconPath = this.fileStorage.saveAsset('favicon', files.favicon);
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
