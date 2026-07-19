import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Put,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { I18nService } from 'nestjs-i18n';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { settingsAssetMulterOptions } from '../../common/utils/file-upload.util';
import { Public } from '../../common/decorators/public.decorator';
import { Roles, RoleName } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';


@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly i18n: I18nService,
  ) {}

  // Public: the login page, favicon, and page <head> all need these values
  // before a user is authenticated.
  @Public()
  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Public()
  @Get('dictionary')
  getDictionary() {
    return this.settingsService.getDictionary();
  }

  @Public()
  @Get('logo')
  async getLogo(@Res() res: Response) {
    const asset = await this.settingsService.getAssetBlob('logo');
    if (!asset) {
      throw new NotFoundException(await this.i18n.translate('settings.LOGO_NOT_FOUND'));
    }
    res.set('Content-Type', asset.mime);
    res.send(asset.data);
  }

 @Public()
  @Get('favicon')
  async getFavicon(@Res() res: Response) {
    const asset = await this.settingsService.getAssetBlob('favicon');
    if (!asset) {
      throw new NotFoundException(await this.i18n.translate('settings.FAVICON_NOT_FOUND'));
    }
    res.set('Content-Type', asset.mime);
    res.send(asset.data);
  }

  @Put()
  @Roles(RoleName.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'logo', maxCount: 1 },
        { name: 'favicon', maxCount: 1 },
      ],
      settingsAssetMulterOptions,
    ),
  )
  updateSettings(
    @Body() dto: UpdateSettingsDto,
    @UploadedFiles()
    files: { logo?: Express.Multer.File[]; favicon?: Express.Multer.File[] },
    @CurrentUser() actor: AuthUser,
  ) {
    return this.settingsService.updateSettings(
      dto,
      { logo: files?.logo?.[0], favicon: files?.favicon?.[0] },
      actor,
    );
  }
}