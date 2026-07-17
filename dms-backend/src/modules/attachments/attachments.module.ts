import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from './entities/attachment.entity';
import { Document } from '../documents/entities/document.entity';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { DocumentsModule } from '../documents/documents.module';
import { ActivityLogModule } from '../activity-logs/activity-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attachment, Document]),
    DocumentsModule,
    ActivityLogModule,
  ],
  controllers: [AttachmentsController],
  providers: [AttachmentsService],
})
export class AttachmentsModule {}