import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from './entities/document.entity';
import { DocumentVersion } from './entities/document-version.entity';
import { DocumentAttachment } from './entities/document-attachment.entity';
import { Folder } from '../folders/entities/folder.entity';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { UploadSizeInterceptor } from '../../common/interceptors/upload-size.interceptor';
import { ActivityLogModule } from '../activity-logs/activity-log.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Document,
      DocumentVersion,
      DocumentAttachment,
      Folder,
    ]),
    ActivityLogModule,
    SettingsModule,
  ],
  providers: [DocumentsService, UploadSizeInterceptor],
  controllers: [DocumentsController],
  exports: [DocumentsService],
})
export class DocumentsModule {}
