import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { FileStorageService } from './file-storage.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { SearchDocumentDto } from './dto/search-document.dto';
import { MoveDocumentDto } from './dto/move-document.dto';
import { multerOptions } from '../../common/utils/file-upload.util';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { Roles, RoleName } from '../../common/decorators/roles.decorator';
import * as fs from 'fs';

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly fileStorageService: FileStorageService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.documentsService.findAll(user);
  }

  @Get('trash')
  findTrash(@CurrentUser() user: AuthUser) {
    return this.documentsService.findTrash(user);
  }

  @Get('search')
  search(@Query() dto: SearchDocumentDto, @CurrentUser() user: AuthUser) {
    return this.documentsService.search(dto, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.documentsService.findOne(id, user);
  }

  @Post()
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  create(
    @Body() dto: CreateDocumentDto,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: AuthUser,
  ) {
    return this.documentsService.create(dto, files, user);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documentsService.update(id, dto, user);
  }

  @Put(':id/update-file')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  updateFile(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documentsService.updateFile(id, file, user);
  }

  @Delete(':id')
  softDelete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.documentsService.softDelete(id, user);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.documentsService.restore(id, user);
  }

  @Delete(':id/permanent')
  @Roles(RoleName.ADMIN)
  permanentDelete(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.permanentDelete(id);
  }

  @Patch(':id/move')
  move(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MoveDocumentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documentsService.move(id, dto, user);
  }

  @Get(':id/download')
  async download(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const version = await this.documentsService.getLatestVersion(id, user);
    const absPath = this.fileStorageService.getAbsolutePath(version.filePath);
    if (!this.fileStorageService.fileExists(version.filePath)) {
      throw new NotFoundException('File not found on disk');
    }
    return res.download(absPath, version.originalFileName || 'document');
  }

  @Get(':id/preview')
  async preview(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const version = await this.documentsService.getLatestVersion(id, user);
    const absPath = this.fileStorageService.getAbsolutePath(version.filePath);

    if (!this.fileStorageService.fileExists(version.filePath)) {
      throw new NotFoundException('File not found on disk');
    }

    const mimeType = version.mimeType || 'application/octet-stream';

    // File types the browser (or our frontend JS libraries) can render inline
    const browserPreviewable = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'text/plain', 'text/csv', 'application/json',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12',
    ];

    const isBrowserPreviewable = browserPreviewable.some((type) =>
      mimeType.includes(type),
    );

    if (!isBrowserPreviewable) {
      return res.status(400).json({
        message: `Preview not available for ${mimeType} files. Please download to view.`,
        downloadUrl: `/api/documents/${id}/download`,
      });
    }

    const fileBuffer = fs.readFileSync(absPath);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(version.originalFileName || 'document')}"`,
      'Content-Length': fileBuffer.length,
    });

    res.send(fileBuffer);
  }

  @Get(':id/versions')
  getVersions(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.documentsService.getVersions(id, user);
  }

  @Get(':id/version/:versionId/download')
  async downloadVersion(
    @Param('id', ParseIntPipe) id: number,
    @Param('versionId', ParseIntPipe) versionId: number,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const version = await this.documentsService.getVersion(id, versionId, user);
    const absPath = this.fileStorageService.getAbsolutePath(version.filePath);
    if (!this.fileStorageService.fileExists(version.filePath)) {
      throw new NotFoundException('File not found on disk');
    }
    return res.download(
      absPath,
      version.originalFileName || `version-${version.versionNumber}`,
    );
  }

  @Patch(':id/restore-version/:versionId')
  restoreVersion(
    @Param('id', ParseIntPipe) id: number,
    @Param('versionId', ParseIntPipe) versionId: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documentsService.restoreVersion(id, versionId, user);
  }

  @Get(':id/attachments')
  getAttachments(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.documentsService.getAttachments(id, user);
  }

@Post(':id/attachments')
@UseInterceptors(FilesInterceptor('files', 10, multerOptions))
addAttachment(
  @Param('id', ParseIntPipe) id: number,
  @UploadedFiles() files: Express.Multer.File[],
  @CurrentUser() user: AuthUser,
) {
  return this.documentsService.addAttachment(id, files, user);
}

  @Get('attachments/:attachmentId/download')
  async downloadAttachment(
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const attachment = await this.documentsService.getAttachment(
      attachmentId,
      user,
    );
    const absPath = this.fileStorageService.getAbsolutePath(
      attachment.filePath,
    );
    if (!this.fileStorageService.fileExists(attachment.filePath)) {
      throw new NotFoundException('File not found on disk');
    }
    return res.download(absPath, attachment.fileName);
  }

  @Delete('attachments/:id')
  deleteAttachment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documentsService.deleteAttachment(id, user);
  }
}
