import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { Document } from './entities/document.entity';
import { DocumentVersion } from './entities/document-version.entity';
import { DocumentAttachment } from './entities/document-attachment.entity';
import { Folder } from '../folders/entities/folder.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { SearchDocumentDto } from './dto/search-document.dto';
import { MoveDocumentDto } from './dto/move-document.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { RoleName } from '../../common/decorators/roles.decorator';
import { FileStorageService } from './file-storage.service';
import { ActivityLogService } from '../activity-logs/activity-log.service';
import { ActivityAction } from '../activity-logs/activity-action.enum';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    @InjectRepository(DocumentVersion)
    private versionsRepository: Repository<DocumentVersion>,
    @InjectRepository(DocumentAttachment)
    private attachmentsRepository: Repository<DocumentAttachment>,
    @InjectRepository(Folder)
    private foldersRepository: Repository<Folder>,
    private fileStorageService: FileStorageService,
    private readonly activityLogService: ActivityLogService,
    private i18n: I18nService,
  ) {}

  // ---------- Permission helpers ----------

  private canRead(user: AuthUser, document: Document): boolean {
    if (user.roleName === RoleName.ADMIN) return true;
    if (user.roleName === RoleName.MANAGER) {
      return document.folder.departmentId === user.departmentId;
    }
    return (
      document.ownerId === user.userId ||
      document.folder.departmentId === user.departmentId
    );
  }

  private canModify(user: AuthUser, document: Document): boolean {
    if (user.roleName === RoleName.ADMIN) return true;
    if (user.roleName === RoleName.MANAGER) {
      return document.folder.departmentId === user.departmentId;
    }
    return document.ownerId === user.userId;
  }

  public checkIsVisible(user: AuthUser, document: Document): boolean {
    return this.canRead(user, document);
  }

  public checkCanModify(user: AuthUser, document: Document): boolean {
    return this.canModify(user, document);
  }

  private async loadDocumentOrFail(id: number): Promise<Document> {
    const document = await this.documentsRepository.findOne({
      where: { id },
      relations: ['folder', 'category', 'owner'],
    });
    if (!document) {
      throw new NotFoundException(await this.i18n.translate('documents.DOCUMENT_NOT_FOUND'));
    }
    return document;
  }

  private async assertFolderAccessible(
    folderId: number,
    user: AuthUser,
  ): Promise<Folder> {
    const folder = await this.foldersRepository.findOne({
      where: { id: folderId },
    });
    if (!folder) {
      throw new NotFoundException(await this.i18n.translate('documents.FOLDER_NOT_FOUND'));
    }
    if (
      user.roleName !== RoleName.ADMIN &&
      folder.departmentId !== user.departmentId
    ) {
      throw new ForbiddenException(
        await this.i18n.translate('documents.FOLDER_DEPARTMENT_ACCESS_DENIED'),
      );
    }
    return folder;
  }

  // ---------- Queries ----------

  async findAll(user: AuthUser): Promise<Document[]> {
    const qb = this.documentsRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.folder', 'folder')
      .leftJoinAndSelect('document.category', 'category')
      .leftJoinAndSelect('document.owner', 'owner')
      .where('document.is_deleted = false');

    if (user.roleName === RoleName.MANAGER) {
      qb.andWhere('folder.department_id = :departmentId', {
        departmentId: user.departmentId,
      });
    } else if (user.roleName === RoleName.EMPLOYEE) {
      qb.andWhere(
        '(document.owner_id = :userId OR folder.department_id = :departmentId)',
        { userId: user.userId, departmentId: user.departmentId },
      );
    }

    qb.orderBy('document.updated_at', 'DESC');
    return qb.getMany();
  }

  async findTrash(user: AuthUser): Promise<Document[]> {
    const qb = this.documentsRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.folder', 'folder')
      .leftJoinAndSelect('document.category', 'category')
      .leftJoinAndSelect('document.owner', 'owner')
      .where('document.is_deleted = true');

    if (user.roleName === RoleName.MANAGER) {
      qb.andWhere('folder.department_id = :departmentId', {
        departmentId: user.departmentId,
      });
    } else if (user.roleName === RoleName.EMPLOYEE) {
      qb.andWhere('document.owner_id = :userId', { userId: user.userId });
    }

    qb.orderBy('document.updated_at', 'DESC');
    return qb.getMany();
  }

  async findOne(id: number, user: AuthUser): Promise<Document> {
    const document = await this.loadDocumentOrFail(id);
    if (!this.canRead(user, document)) {
      throw new ForbiddenException(
        await this.i18n.translate('documents.DOCUMENT_VIEW_DENIED'),
      );
    }
    return document;
  }

  async search(dto: SearchDocumentDto, user: AuthUser): Promise<Document[]> {
    const qb = this.documentsRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.folder', 'folder')
      .leftJoinAndSelect('document.category', 'category')
      .leftJoinAndSelect('document.owner', 'owner')
      .where('document.is_deleted = false');

    if (user.roleName === RoleName.MANAGER) {
      qb.andWhere('folder.department_id = :departmentId', {
        departmentId: user.departmentId,
      });
    } else if (user.roleName === RoleName.EMPLOYEE) {
      qb.andWhere(
        '(document.owner_id = :userId OR folder.department_id = :departmentId)',
        { userId: user.userId, departmentId: user.departmentId },
      );
    }

    if (dto.departmentId) {
      if (user.roleName !== RoleName.ADMIN) {
        throw new ForbiddenException(
          await this.i18n.translate('documents.DEPARTMENT_FILTER_ADMIN_ONLY'),
        );
      }
      qb.andWhere('folder.department_id = :filterDepartmentId', {
        filterDepartmentId: dto.departmentId,
      });
    }

    if (dto.name) {
      qb.andWhere('LOWER(document.name) LIKE :name', {
        name: `%${dto.name.toLowerCase()}%`,
      });
    }
    if (dto.categoryId) {
      qb.andWhere('document.category_id = :categoryId', {
        categoryId: dto.categoryId,
      });
    }
    if (dto.folderId) {
      qb.andWhere('document.folder_id = :folderId', {
        folderId: dto.folderId,
      });
    }
    if (dto.ownerId) {
      qb.andWhere('document.owner_id = :ownerId', { ownerId: dto.ownerId });
    }
    if (dto.dateFrom) {
      qb.andWhere('document.created_at >= :dateFrom', {
        dateFrom: dto.dateFrom,
      });
    }
    if (dto.dateTo) {
      qb.andWhere('document.created_at <= :dateTo', { dateTo: dto.dateTo });
    }

    qb.orderBy('document.updated_at', 'DESC');
    return qb.getMany();
  }

  // ---------- Mutations ----------

  async create(
    dto: CreateDocumentDto,
    files: Express.Multer.File[],
    user: AuthUser,
  ): Promise<Document[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException(await this.i18n.translate('documents.FILE_REQUIRED_FOR_UPLOAD'));
    }

    await this.assertFolderAccessible(dto.folderId, user);

    const createdDocs: Document[] = [];

    for (const file of files) {
      const document = this.documentsRepository.create({
        name: files.length > 1 ? file.originalname : (dto.name || file.originalname),
        description: dto.description,
        folderId: dto.folderId,
        categoryId: dto.categoryId,
        ownerId: user.userId,
      });
      const saved = await this.documentsRepository.save(document);

      const relativePath = this.fileStorageService.saveFile(
        'documents',
        saved.id,
        file.originalname,
        file.buffer,
      );

      const version = this.versionsRepository.create({
        documentId: saved.id,
        uploadedById: user.userId,
        versionNumber: 1,
        filePath: relativePath,
        originalFileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
      });
      await this.versionsRepository.save(version);

      const fullyLoadedDoc = await this.loadDocumentOrFail(saved.id);
      createdDocs.push(fullyLoadedDoc);

      await this.activityLogService.log({
        actor: this.activityLogService.fromAuthUser(user),
        action: ActivityAction.DOCUMENT_UPLOAD,
        targetType: 'Document',
        targetId: saved.id,
        description: await this.i18n.translate('documents.UPLOAD_LOG', {
          args: { 
            documentName: fullyLoadedDoc.name, 
            folderName: fullyLoadedDoc.folder?.name || String(dto.folderId) 
          }
        }),
      });
    }

    return createdDocs;
  }

  async update(
    id: number,
    dto: UpdateDocumentDto,
    user: AuthUser,
  ): Promise<Document> {
    const document = await this.loadDocumentOrFail(id);
    if (!this.canModify(user, document)) {
      throw new ForbiddenException(
        await this.i18n.translate('documents.DOCUMENT_UPDATE_DENIED'),
      );
    }
    
    const oldName = document.name;

    Object.assign(document, dto);
    await this.documentsRepository.save(document);
    
    const updatedDoc = await this.loadDocumentOrFail(id);

    let description = await this.i18n.translate('documents.UPDATE_LOG', {
      args: { oldName }
    });
    
    if (dto.name) {
      description += ' ' + await this.i18n.translate('documents.RENAME_LOG', {
        args: { newName: dto.name }
      });
    }

    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(user),
      action: ActivityAction.DOCUMENT_UPDATE,
      targetType: 'Document',
      targetId: id,
      description,
    });

    return updatedDoc;
  }

  async updateFile(
    id: number,
    file: Express.Multer.File,
    user: AuthUser,
  ): Promise<Document> {
    if (!file) {
      throw new BadRequestException(await this.i18n.translate('documents.FILE_REQUIRED'));
    }
    const document = await this.loadDocumentOrFail(id);
    if (!this.canModify(user, document)) {
      throw new ForbiddenException(
        await this.i18n.translate('documents.DOCUMENT_UPDATE_DENIED'),
      );
    }

    const latestVersion = await this.versionsRepository.findOne({
      where: { documentId: id },
      order: { versionNumber: 'DESC' },
    });
    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    const relativePath = this.fileStorageService.saveFile(
      'documents',
      id,
      file.originalname,
      file.buffer,
    );

    const version = this.versionsRepository.create({
      documentId: id,
      uploadedById: user.userId,
      versionNumber: nextVersionNumber,
      filePath: relativePath,
      originalFileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
    });
    await this.versionsRepository.save(version);

    document.updatedAt = new Date();
    await this.documentsRepository.save(document);

    const updatedDoc = await this.loadDocumentOrFail(id);

    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(user),
      action: ActivityAction.DOCUMENT_UPDATE,
      targetType: 'Document',
      targetId: id,
      description: await this.i18n.translate('documents.FILE_UPDATE_LOG', {
        args: { 
          versionNumber: nextVersionNumber, 
          documentName: updatedDoc.name, 
          fileName: file.originalname 
        }
      }),
    });

    return updatedDoc;
  }

  async softDelete(id: number, user: AuthUser): Promise<Document> {
    const document = await this.loadDocumentOrFail(id);
    const isOwner = document.ownerId === user.userId;
    const isAdmin = user.roleName === RoleName.ADMIN;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        await this.i18n.translate('documents.DOCUMENT_DELETE_DENIED'),
      );
    }
    
    const currentDocName = document.name;

    document.isDeleted = true;
    const savedDoc = await this.documentsRepository.save(document);

    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(user),
      action: ActivityAction.DOCUMENT_DELETE,
      targetType: 'Document',
      targetId: id,
      description: await this.i18n.translate('documents.SOFT_DELETE_LOG', {
        args: { documentName: currentDocName }
      }),
    });

    return savedDoc;
  }

  async restore(id: number, user: AuthUser): Promise<Document> {
    const document = await this.loadDocumentOrFail(id);
    const isOwner = document.ownerId === user.userId;
    const isAdmin = user.roleName === RoleName.ADMIN;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        await this.i18n.translate('documents.DOCUMENT_RESTORE_DENIED'),
      );
    }
    
    const currentDocName = document.name;

    document.isDeleted = false;
    const savedDoc = await this.documentsRepository.save(document);

    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(user),
      action: ActivityAction.DOCUMENT_RESTORE,
      targetType: 'Document',
      targetId: id,
      description: await this.i18n.translate('documents.RESTORE_LOG', {
        args: { documentName: currentDocName }
      }),
    });

    return savedDoc;
  }

  // ✅ FIXED: permanentDelete now uses i18n
  async permanentDelete(id: number, user: AuthUser): Promise<void> {
    const document = await this.documentsRepository.findOne({
      where: { id },
      relations: ['versions', 'attachments'],
    });
    if (!document) {
      throw new NotFoundException(await this.i18n.translate('documents.DOCUMENT_NOT_FOUND'));
    }

    const documentName = document.name;

    for (const version of document.versions || []) {
      this.fileStorageService.deleteFile(version.filePath);
    }
    for (const attachment of document.attachments || []) {
      this.fileStorageService.deleteFile(attachment.filePath);
    }

    await this.documentsRepository.remove(document);

    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(user),
      action: ActivityAction.DOCUMENT_DELETE,
      targetType: 'Document',
      targetId: id,
      description: await this.i18n.translate('documents.PERMANENT_DELETE_LOG', {
        args: { documentName }
      }),
    });
  }

  async move(
    id: number,
    dto: MoveDocumentDto,
    user: AuthUser,
  ): Promise<Document> {
    const document = await this.loadDocumentOrFail(id);
    if (!this.canModify(user, document)) {
      throw new ForbiddenException(
        await this.i18n.translate('documents.DOCUMENT_MOVE_DENIED'),
      );
    }
    const targetFolder = await this.assertFolderAccessible(
      dto.folderId,
      user,
    );

    if (
      user.roleName !== RoleName.ADMIN &&
      targetFolder.departmentId !== document.folder.departmentId
    ) {
      throw new ForbiddenException(
        await this.i18n.translate('documents.DOCUMENT_MOVE_DEPARTMENT_MISMATCH'),
      );
    }

    const sourceFolderName = document.folder?.name || `Folder #${document.folderId}`;

    await this.documentsRepository.update(id, { folderId: dto.folderId });
    
    const movedDoc = await this.loadDocumentOrFail(id);

    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(user),
      action: ActivityAction.DOCUMENT_MOVE,
      targetType: 'Document',
      targetId: id,
      description: await this.i18n.translate('documents.MOVE_LOG', {
        args: { 
          documentName: movedDoc.name, 
          sourceFolder: sourceFolderName, 
          targetFolder: targetFolder.name 
        }
      }),
    });

    return movedDoc;
  }

  // ---------- Versions ----------

  async getVersions(id: number, user: AuthUser): Promise<DocumentVersion[]> {
    const document = await this.findOne(id, user);
    return this.versionsRepository.find({
      where: { documentId: document.id },
      order: { versionNumber: 'DESC' },
    });
  }

  async getVersion(
    id: number,
    versionId: number,
    user: AuthUser,
  ): Promise<DocumentVersion> {
    await this.findOne(id, user);
    const version = await this.versionsRepository.findOne({
      where: { id: versionId, documentId: id },
    });
    if (!version) {
      throw new NotFoundException(await this.i18n.translate('documents.VERSION_NOT_FOUND'));
    }
    return version;
  }

  async restoreVersion(
    id: number,
    versionId: number,
    user: AuthUser,
  ): Promise<Document> {
    const document = await this.loadDocumentOrFail(id);
    if (!this.canModify(user, document)) {
      throw new ForbiddenException(
        await this.i18n.translate('documents.VERSION_RESTORE_DENIED'),
      );
    }
    const targetVersion = await this.versionsRepository.findOne({
      where: { id: versionId, documentId: id },
    });
    if (!targetVersion) {
      throw new NotFoundException(await this.i18n.translate('documents.VERSION_NOT_FOUND'));
    }

    const latestVersion = await this.versionsRepository.findOne({
      where: { documentId: id },
      order: { versionNumber: 'DESC' },
    });
    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    const absPath = this.fileStorageService.getAbsolutePath(
      targetVersion.filePath,
    );
    const buffer = fs.readFileSync(absPath);
    const relativePath = this.fileStorageService.saveFile(
      'documents',
      id,
      targetVersion.originalFileName || `restored-v${targetVersion.versionNumber}`,
      buffer,
    );

    const newVersion = this.versionsRepository.create({
      documentId: id,
      uploadedById: user.userId,
      versionNumber: nextVersionNumber,
      filePath: relativePath,
      originalFileName: targetVersion.originalFileName,
      mimeType: targetVersion.mimeType,
      fileSize: targetVersion.fileSize,
    });
    await this.versionsRepository.save(newVersion);

    document.updatedAt = new Date();
    await this.documentsRepository.save(document);

    return this.loadDocumentOrFail(id);
  }

  async getLatestVersion(id: number, user: AuthUser): Promise<DocumentVersion> {
    await this.findOne(id, user);
    const version = await this.versionsRepository.findOne({
      where: { documentId: id },
      order: { versionNumber: 'DESC' },
    });
    if (!version) {
      throw new NotFoundException(await this.i18n.translate('documents.NO_FILE_VERSIONS'));
    }
    return version;
  }

  // ---------- Attachments ----------

  async getAttachments(
    id: number,
    user: AuthUser,
  ): Promise<DocumentAttachment[]> {
    await this.findOne(id, user);
    return this.attachmentsRepository.find({
      where: { documentId: id },
      order: { createdAt: 'DESC' },
    });
  }

  async addAttachment(
    id: number,
    files: Express.Multer.File[],
    user: AuthUser,
  ): Promise<DocumentAttachment[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException(await this.i18n.translate('documents.ATTACHMENT_FILE_REQUIRED'));
    }
    const document = await this.loadDocumentOrFail(id);
    if (!this.canModify(user, document)) {
      throw new ForbiddenException(
        await this.i18n.translate('documents.ATTACHMENT_ADD_DENIED'),
      );
    }

    const attachments: DocumentAttachment[] = [];
    for (const file of files) {
      const relativePath = this.fileStorageService.saveFile(
        'attachments',
        id,
        file.originalname,
        file.buffer,
      );

      const attachment = this.attachmentsRepository.create({
        documentId: id,
        uploadedById: user.userId,
        fileName: file.originalname,
        filePath: relativePath,
        mimeType: file.mimetype,
        fileSize: file.size,
      });
      const savedAttachment = await this.attachmentsRepository.save(attachment);
      attachments.push(savedAttachment);

      await this.activityLogService.log({
        actor: this.activityLogService.fromAuthUser(user),
        action: ActivityAction.DOCUMENT_UPLOAD,
        targetType: 'DocumentAttachment',
        targetId: savedAttachment.id,
        description: await this.i18n.translate('documents.ATTACHMENT_UPLOAD_LOG', {
          args: { fileName: savedAttachment.fileName, documentName: document.name }
        }),
      });
    }

    return attachments;
  }

  // ✅ FIXED: getAttachment now uses i18n
  async getAttachment(
    attachmentId: number,
    user: AuthUser,
  ): Promise<DocumentAttachment> {
    const attachment = await this.attachmentsRepository.findOne({
      where: { id: attachmentId },
    });
    if (!attachment) {
      throw new NotFoundException(await this.i18n.translate('documents.ATTACHMENT_NOT_FOUND'));
    }
    const document = await this.findOne(attachment.documentId, user);
    
    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(user),
      action: ActivityAction.DOCUMENT_DOWNLOAD,
      targetType: 'DocumentAttachment',
      targetId: attachment.id,
      description: await this.i18n.translate('documents.ATTACHMENT_DOWNLOAD_LOG', {
        args: { fileName: attachment.fileName, documentName: document.name }
      }),
    });

    return attachment;
  }

  async deleteAttachment(attachmentId: number, user: AuthUser): Promise<void> {
    const attachment = await this.attachmentsRepository.findOne({
      where: { id: attachmentId },
    });
    if (!attachment) {
      throw new NotFoundException(await this.i18n.translate('documents.ATTACHMENT_NOT_FOUND'));
    }
    const document = await this.loadDocumentOrFail(attachment.documentId);
    if (!this.canModify(user, document)) {
      throw new ForbiddenException(
        await this.i18n.translate('documents.ATTACHMENT_DELETE_DENIED'),
      );
    }
    
    const attachmentName = attachment.fileName;
    this.fileStorageService.deleteFile(attachment.filePath);
    await this.attachmentsRepository.remove(attachment);

    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(user),
      action: ActivityAction.DOCUMENT_DELETE,
      targetType: 'DocumentAttachment',
      targetId: attachmentId,
      description: await this.i18n.translate('documents.ATTACHMENT_DELETE_LOG', {
        args: { fileName: attachmentName, documentName: document.name }
      }),
    });
  }

  // ---------- Dashboard support ----------

  countAll(): Promise<number> {
    return this.documentsRepository.count({ where: { isDeleted: false } });
  }

  countByDepartment(departmentId: number): Promise<number> {
    return this.documentsRepository
      .createQueryBuilder('document')
      .leftJoin('document.folder', 'folder')
      .where('document.is_deleted = false')
      .andWhere('folder.department_id = :departmentId', { departmentId })
      .getCount();
  }

  countByOwner(ownerId: number): Promise<number> {
    return this.documentsRepository.count({
      where: { ownerId, isDeleted: false },
    });
  }

  async recentByOwner(ownerId: number, limit = 5): Promise<Document[]> {
    return this.documentsRepository.find({
      where: { ownerId, isDeleted: false },
      order: { updatedAt: 'DESC' },
      take: limit,
      relations: ['folder', 'category'],
    });
  }

  async storageUsedByOwner(ownerId: number): Promise<number> {
    const result = await this.versionsRepository
      .createQueryBuilder('version')
      .leftJoin('version.document', 'document')
      .where('document.owner_id = :ownerId', { ownerId })
      .select('COALESCE(SUM(version.file_size), 0)', 'total')
      .getRawOne();
    return parseInt(result.total, 10) || 0;
  }

  async storageUsedTotal(): Promise<number> {
    const result = await this.versionsRepository
      .createQueryBuilder('version')
      .select('COALESCE(SUM(version.file_size), 0)', 'total')
      .getRawOne();
    return parseInt(result.total, 10) || 0;
  }
}