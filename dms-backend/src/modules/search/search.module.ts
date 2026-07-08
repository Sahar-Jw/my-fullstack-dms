import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [DocumentsModule],
  controllers: [SearchController],
})
export class SearchModule {}
