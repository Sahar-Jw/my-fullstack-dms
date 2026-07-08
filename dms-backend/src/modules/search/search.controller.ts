import { Controller, Get, Query } from '@nestjs/common';
import { DocumentsService } from '../documents/documents.service';
import { SearchDocumentDto } from '../documents/dto/search-document.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';

/**
 * UC-16 - البحث عن الوثائق (FR-30 حتى FR-33).
 * نقطة نهاية مخصّصة توافقاً مع صفحة "البحث" المستقلة في متطلبات الواجهة (3.1.1)،
 * وتُفوّض المنطق فعلياً إلى DocumentsService.search الذي يطبّق نفس قواعد الصلاحيات.
 */
@Controller('search')
export class SearchController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  search(
    @Query() filters: SearchDocumentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documentsService.search(filters, user);
  }
}
