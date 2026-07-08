import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from './entities/document.entity';
import { DocumentVersion } from './entities/document-version.entity';
import { DocumentAttachment } from './entities/document-attachment.entity';
import { Folder } from '../folders/entities/folder.entity';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { FileStorageService } from './file-storage.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Document,
      DocumentVersion,
      DocumentAttachment,
      Folder,
    ]),
  ],
  providers: [DocumentsService, FileStorageService],
  controllers: [DocumentsController],
  exports: [DocumentsService],
})
export class DocumentsModule {}
