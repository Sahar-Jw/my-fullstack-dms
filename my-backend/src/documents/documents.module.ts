import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { Document } from './entities/document.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService],
  imports:[TypeOrmModule.forFeature([Document])],
})
export class DocumentsModule {}
