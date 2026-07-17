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
  ) {}

  private async getDocumentOrFail(documentId: number): Promise<Document> {
    const document = await this.documentsRepository.findOne({
      where: { id: documentId },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
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
      throw new BadRequestException('Please select at least one file to upload');
    }

    const document = await this.getDocumentOrFail(documentId);

    if (!this.documentsService.checkCanModify(user, document)) {
      throw new ForbiddenException(
        'You are not authorized to add attachments to this document',
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

    // 🔥 تعديل: استخدام DOCUMENT_UPLOAD لتظهر كعملية رفع واضحة ومستقلة في جدول الأنشطة
    const fileNames = savedAttachments.map(a => a.fileName).join(', ');
    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(user),
      action: ActivityAction.DOCUMENT_UPLOAD, // 👈 تم التغيير هنا لتعمل بشكل فوري ومباشر
      targetType: 'Document',
      targetId: document.id,
      description: `Uploaded attachment(s) to document "${document.name}": [${fileNames}]`,
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
      throw new ForbiddenException('You are not authorized to access this document');
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
      throw new NotFoundException('Attachment not found');
    }

    if (!this.documentsService.checkIsVisible(user, attachment.document)) {
      throw new ForbiddenException('You are not authorized to download this attachment');
    }

    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(user),
      action: ActivityAction.DOCUMENT_DOWNLOAD,
      targetType: 'Attachment',
      targetId: attachment.id,
      description: `Downloaded attachment "${attachment.fileName}" from document "${attachment.document.name}"`,
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
      throw new NotFoundException('Attachment not found');
    }

    if (!this.documentsService.checkCanModify(user, attachment.document)) {
      throw new ForbiddenException('You are not authorized to delete this attachment');
    }

    const fullPath = join(UPLOAD_ROOT, attachment.filePath);
    if (existsSync(fullPath)) {
      unlinkSync(fullPath);
    }

    await this.attachmentsRepository.remove(attachment);

    // 🔥 تعديل: استخدام DOCUMENT_DELETE لتظهر كعملية حذف مرفق داخل المستند
    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(user),
      action: ActivityAction.DOCUMENT_DELETE, // 👈 تم التغيير هنا لتعمل بشكل فوري ومباشر
      targetType: 'Document',
      targetId: attachment.document.id,
      description: `Deleted attachment "${attachment.fileName}" from document "${attachment.document.name}"`,
    });

    return { message: 'Attachment deleted successfully' };
  }
}
