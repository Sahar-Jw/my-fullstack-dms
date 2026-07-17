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
      throw new NotFoundException(`Document not found`);
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
      throw new NotFoundException(`Folder not found`);
    }
    if (
      user.roleName !== RoleName.ADMIN &&
      folder.departmentId !== user.departmentId
    ) {
      throw new ForbiddenException(
        'You do not have access to this folder\'s department',
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
        'You do not have permission to view this document',
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

    // Department filter — Admin only. Uses a distinct param name
    // (filterDepartmentId) so it never collides with the :departmentId
    // binding already used above for Manager/Employee scoping.
    if (dto.departmentId) {
      if (user.roleName !== RoleName.ADMIN) {
        throw new ForbiddenException(
          'Only Admins can filter documents by department',
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

  /**
   * Creates one or more Documents from an array of uploaded files.
   * - Single file: uses dto.name (or falls back to the filename) as the document name.
   * - Multiple files: each file becomes its own Document, named after its filename
   *   (dto.name is ignored in this case since one name can't apply to N documents).
   */
  async create(
    dto: CreateDocumentDto,
    files: Express.Multer.File[],
    user: AuthUser,
  ): Promise<Document[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required to upload a document');
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

      createdDocs.push(await this.loadDocumentOrFail(saved.id));
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
        'You do not have permission to update this document',
      );
    }
    Object.assign(document, dto);
    await this.documentsRepository.save(document);
    return this.loadDocumentOrFail(id);
  }

  async updateFile(
    id: number,
    file: Express.Multer.File,
    user: AuthUser,
  ): Promise<Document> {
    if (!file) {
      throw new BadRequestException('A file is required');
    }
    const document = await this.loadDocumentOrFail(id);
    if (!this.canModify(user, document)) {
      throw new ForbiddenException(
        'You do not have permission to update this document',
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

    return this.loadDocumentOrFail(id);
  }

  async softDelete(id: number, user: AuthUser): Promise<Document> {
    const document = await this.loadDocumentOrFail(id);
    const isOwner = document.ownerId === user.userId;
    const isAdmin = user.roleName === RoleName.ADMIN;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Only the document owner or an Admin can delete this document',
      );
    }
    document.isDeleted = true;
    return this.documentsRepository.save(document);
  }

  async restore(id: number, user: AuthUser): Promise<Document> {
    const document = await this.loadDocumentOrFail(id);
    const isOwner = document.ownerId === user.userId;
    const isAdmin = user.roleName === RoleName.ADMIN;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Only the document owner or an Admin can restore this document',
      );
    }
    document.isDeleted = false;
    return this.documentsRepository.save(document);
  }

  async permanentDelete(id: number): Promise<void> {
    const document = await this.documentsRepository.findOne({
      where: { id },
      relations: ['versions', 'attachments'],
    });
    if (!document) {
      throw new NotFoundException(`Document not found`);
    }

    for (const version of document.versions || []) {
      this.fileStorageService.deleteFile(version.filePath);
    }
    for (const attachment of document.attachments || []) {
      this.fileStorageService.deleteFile(attachment.filePath);
    }

    await this.documentsRepository.remove(document);
  }

  async move(
    id: number,
    dto: MoveDocumentDto,
    user: AuthUser,
  ): Promise<Document> {
    const document = await this.loadDocumentOrFail(id);
    if (!this.canModify(user, document)) {
      throw new ForbiddenException(
        'You do not have permission to move this document',
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
        'Cannot move a document to a folder in a different department',
      );
    }

    await this.documentsRepository.update(id, { folderId: dto.folderId });
    return this.loadDocumentOrFail(id);
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
      throw new NotFoundException('Version not found');
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
        'You do not have permission to restore a version of this document',
      );
    }
    const targetVersion = await this.versionsRepository.findOne({
      where: { id: versionId, documentId: id },
    });
    if (!targetVersion) {
      throw new NotFoundException('Version not found');
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
      throw new NotFoundException('This document has no file versions');
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

  // async addAttachment(
  //   id: number,
  //   file: Express.Multer.File,
  //   user: AuthUser,
  // ): Promise<DocumentAttachment> {
  //   if (!file) {
  //     throw new BadRequestException('A file is required');
  //   }
  //   const document = await this.loadDocumentOrFail(id);
  //   if (!this.canModify(user, document)) {
  //     throw new ForbiddenException(
  //       'You do not have permission to add attachments to this document',
  //     );
  //   }

  //   const relativePath = this.fileStorageService.saveFile(
  //     'attachments',
  //     id,
  //     file.originalname,
  //     file.buffer,
  //   );

  //   const attachment = this.attachmentsRepository.create({
  //     documentId: id,
  //     uploadedById: user.userId,
  //     fileName: file.originalname,
  //     filePath: relativePath,
  //     mimeType: file.mimetype,
  //     fileSize: file.size,
  //   });
  //   return this.attachmentsRepository.save(attachment);
  // }

  async addAttachment(
  id: number,
  files: Express.Multer.File[],
  user: AuthUser,
): Promise<DocumentAttachment[]> {
  if (!files || files.length === 0) {
    throw new BadRequestException('At least one file is required');
  }
  const document = await this.loadDocumentOrFail(id);
  if (!this.canModify(user, document)) {
    throw new ForbiddenException(
      'You do not have permission to add attachments to this document',
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
    attachments.push(await this.attachmentsRepository.save(attachment));
  }

  return attachments;
}

  async getAttachment(
    attachmentId: number,
    user: AuthUser,
  ): Promise<DocumentAttachment> {
    const attachment = await this.attachmentsRepository.findOne({
      where: { id: attachmentId },
    });
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }
    await this.findOne(attachment.documentId, user);
    return attachment;
  }

  async deleteAttachment(attachmentId: number, user: AuthUser): Promise<void> {
    const attachment = await this.attachmentsRepository.findOne({
      where: { id: attachmentId },
    });
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }
    const document = await this.loadDocumentOrFail(attachment.documentId);
    if (!this.canModify(user, document)) {
      throw new ForbiddenException(
        'You do not have permission to delete this attachment',
      );
    }
    this.fileStorageService.deleteFile(attachment.filePath);
    await this.attachmentsRepository.remove(attachment);
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
