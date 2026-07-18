import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { I18nService } from 'nestjs-i18n';
import { SettingsService } from '../../modules/settings/settings.service';

// Applied to document/attachment upload routes. Multer's own `limits.fileSize`
// (see file-upload.util.ts) is a fixed, generous ceiling that runs first and
// protects the server from abuse; this interceptor enforces the actual,
// admin-configurable limit from the Settings table on every request.
@Injectable()
export class UploadSizeInterceptor implements NestInterceptor {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly i18n: I18nService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const files: Express.Multer.File[] = request.files
      ? Array.isArray(request.files)
        ? request.files
        : Object.values(request.files).flat()
      : request.file
        ? [request.file]
        : [];

    if (files.length > 0) {
      const maxBytes = await this.settingsService.getMaxUploadSizeBytes();
      const maxMb = await this.settingsService.getMaxUploadSizeMb();
      const oversized = files.find((f) => f.size > maxBytes);
      if (oversized) {
        throw new BadRequestException(
          await this.i18n.translate('settings.FILE_TOO_LARGE', { args: { max: maxMb } }),
        );
      }
    }

    return next.handle();
  }
}
