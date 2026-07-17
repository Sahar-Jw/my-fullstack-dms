import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AttachmentsService } from './attachments.service';

import { buildMulterOptions } from '../../common/utils/multer.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';

@Controller()
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  // UC-13 - رفع مرفقات لوثيقة (FR-26)
  @Post('documents/:documentId/attachments')
  @UseInterceptors(FilesInterceptor('files', 10, buildMulterOptions('attachments')))
  upload(
    @Param('documentId', ParseIntPipe) documentId: number,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: AuthUser,
  ) {
    return this.attachmentsService.upload(documentId, files, user);
  }

  // FR-27 - عرض قائمة مرفقات الوثيقة
  @HttpCode(HttpStatus.OK)
  @Get('documents/:documentId/attachments')
  findByDocument(
    @Param('documentId', ParseIntPipe) documentId: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.attachmentsService.findByDocument(documentId, user);
  }

  // UC-15 - تنزيل مرفق (FR-28)
  @Get('attachments/:id/download')
  async download(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const { fullPath, fileName } =
      await this.attachmentsService.getFileForDownload(id, user);
    return res.download(fullPath, fileName);
  }

  // UC-14 - حذف مرفق (FR-29)
  @Delete('attachments/:id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.attachmentsService.remove(id, user);
  }
}