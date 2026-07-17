import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Attachment } from './entities/attachment.entity';
import { Document } from '../documents/entities/document.entity';
import { DocumentsService } from '../documents/documents.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { relativeStoredPath } from '../../common/utils/multer.config';
import { ActivityLogService } from '../activity-logs/activity-log.service';
import { ActivityAction } from '../activity-logs/activity-action.enum';
import { I18nService } from 'nestjs-i18n';

const UPLOAD_ROOT = process.env.UPLOAD_ROOT || './uploads';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private attachmentsRepository: Repository<Attachment>,
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    private documentsService: DocumentsService,
    private readonly activityLogService: ActivityLogService,
    private readonly i18n: I18nService, // Add i18n service
  ) {}

  private async getDocumentOrFail(documentId: number): Promise<Document> {
    const document = await this.documentsRepository.findOne({
      where: { id: documentId },
    });
    if (!document) {
      throw new NotFoundException(await this.i18n.translate('validation.DOCUMENT_NOT_FOUND'));
    }
    return document;
  }

  // UC-13 - رفع مرفقات (FR-26)
  async upload(
    documentId: number,
    files: Express.Multer.File[],
    user: AuthUser,
  ): Promise<Attachment[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException(await this.i18n.translate('validation.NO_FILES_SELECTED'));
    }

    const document = await this.getDocumentOrFail(documentId);

    if (!this.documentsService.checkCanModify(user, document)) {
      throw new ForbiddenException(
        await this.i18n.translate('validation.ATTACHMENT_UPLOAD_UNAUTHORIZED'),
      );
    }

    const attachments = files.map((file) =>
      this.attachmentsRepository.create({
        document,
        documentId: document.id,
        fileName: file.originalname,
        filePath: relativeStoredPath('attachments', file.filename),
        uploadedById: user.userId,
      }),
    );

    const savedAttachments = await this.attachmentsRepository.save(attachments);

    // Activity log with translated description
    const fileNames = savedAttachments.map(a => a.fileName).join(', ');
    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(user),
      action: ActivityAction.DOCUMENT_UPLOAD,
      targetType: 'Document',
      targetId: document.id,
      description: await this.i18n.translate('validation.ATTACHMENT_UPLOAD_LOG', {
        args: { fileName: fileNames, documentName: document.name }
      }),
    });

    return savedAttachments;
  }

  // UC-13 (متابعة) / FR-27: عرض قائمة المرفقات الخاصة بالوثيقة
  async findByDocument(
    documentId: number,
    user: AuthUser,
  ): Promise<Attachment[]> {
    const document = await this.getDocumentOrFail(documentId);

    if (!this.documentsService.checkIsVisible(user, document)) {
      throw new ForbiddenException(await this.i18n.translate('validation.DOCUMENT_ACCESS_UNAUTHORIZED'));
    }

    return this.attachmentsRepository.find({
      where: { documentId },
      order: { uploadedAt: 'DESC' },
    });
  }

  // UC-15 - تنزيل مرفقات (FR-28)
  async getFileForDownload(attachmentId: number, user: AuthUser) {
    const attachment = await this.attachmentsRepository.findOne({
      where: { id: attachmentId },
      relations: ['document'],
    });

    if (!attachment) {
      throw new NotFoundException(await this.i18n.translate('validation.ATTACHMENT_NOT_FOUND'));
    }

    if (!this.documentsService.checkIsVisible(user, attachment.document)) {
      throw new ForbiddenException(await this.i18n.translate('validation.ATTACHMENT_DOWNLOAD_UNAUTHORIZED'));
    }

    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(user),
      action: ActivityAction.DOCUMENT_DOWNLOAD,
      targetType: 'Attachment',
      targetId: attachment.id,
      description: await this.i18n.translate('validation.ATTACHMENT_DOWNLOAD_LOG', {
        args: { fileName: attachment.fileName, documentName: attachment.document.name }
      }),
    });

    return {
      fullPath: join(UPLOAD_ROOT, attachment.filePath),
      fileName: attachment.fileName,
    };
  }

  // UC-14 - حذف مرفقات (FR-29)
  async remove(
    attachmentId: number,
    user: AuthUser,
  ): Promise<{ message: string }> {
    const attachment = await this.attachmentsRepository.findOne({
      where: { id: attachmentId },
      relations: ['document'],
    });

    if (!attachment) {
      throw new NotFoundException(await this.i18n.translate('validation.ATTACHMENT_NOT_FOUND'));
    }

    if (!this.documentsService.checkCanModify(user, attachment.document)) {
      throw new ForbiddenException(await this.i18n.translate('validation.ATTACHMENT_DELETE_UNAUTHORIZED'));
    }

    const fullPath = join(UPLOAD_ROOT, attachment.filePath);
    if (existsSync(fullPath)) {
      unlinkSync(fullPath);
    }

    await this.attachmentsRepository.remove(attachment);

    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(user),
      action: ActivityAction.DOCUMENT_DELETE,
      targetType: 'Document',
      targetId: attachment.document.id,
      description: await this.i18n.translate('validation.ATTACHMENT_DELETE_LOG', {
        args: { fileName: attachment.fileName, documentName: attachment.document.name }
      }),
    });

    return { message: await this.i18n.translate('validation.ATTACHMENT_DELETED_SUCCESS') };
  }
}