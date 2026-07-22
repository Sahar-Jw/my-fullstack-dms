import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Folder } from './entities/folder.entity';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { RoleName } from '../../common/decorators/roles.decorator';
import { ActivityLogService } from '../activity-logs/activity-log.service';
import { ActivityAction } from '../activity-logs/activity-action.enum';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(Folder)
    private foldersRepository: Repository<Folder>,
    private readonly activityLogService: ActivityLogService,
    private readonly i18n: I18nService,
  ) {}

  // Make this method async since we need to use await with translate
  private async assertCanManage(user: AuthUser, departmentId: number) {
    if (user.roleName === RoleName.ADMIN) return;
    if (user.roleName === RoleName.MANAGER) {
      if (user.departmentId !== departmentId) {
        throw new ForbiddenException(
          await this.i18n.translate('folders.MANAGER_DEPARTMENT_ONLY'),
        );
      }
      return;
    }
    throw new ForbiddenException(
      await this.i18n.translate('folders.EMPLOYEE_VIEW_ONLY'),
    );
  }

  private async loadFolderOrFail(id: number, user: AuthUser): Promise<Folder> {
    const folder = await this.foldersRepository.findOne({
      where: { id },
      relations: {department : true, parentFolder : true}
    });
    if (!folder) {
      throw new NotFoundException(await this.i18n.translate('folders.FOLDER_NOT_FOUND'));
    }
    if (
      user.roleName !== RoleName.ADMIN &&
      folder.departmentId !== user.departmentId
    ) {
      throw new ForbiddenException(
        await this.i18n.translate('folders.FOLDER_ACCESS_DENIED'),
      );
    }
    return folder;
  }

  async findAll(user: AuthUser): Promise<Folder[]> {
    if (user.roleName === RoleName.ADMIN) {
      return this.foldersRepository.find({ order: { name: 'ASC' } });
    }
    return this.foldersRepository.find({
      where: { departmentId: user.departmentId },
      order: { name: 'ASC' },
    });
  }

  private async getDocumentCounts(
    folderIds: number[],
  ): Promise<Map<number, number>> {
    const counts = new Map<number, number>();
    if (folderIds.length === 0) {
      return counts;
    }

    const rows = await this.foldersRepository
      .createQueryBuilder('folder')
      .leftJoin(
        'folder.documents',
        'document',
        'document.is_deleted = false',
      )
      .select('folder.id', 'folderId')
      .addSelect('COUNT(document.id)', 'count')
      .where('folder.id IN (:...folderIds)', { folderIds })
      .groupBy('folder.id')
      .getRawMany();

    rows.forEach((row) => {
      counts.set(Number(row.folderId), parseInt(row.count, 10) || 0);
    });
    return counts;
  }

  async getTree(user: AuthUser): Promise<any[]> {
    const folders = await this.findAll(user);
    const counts = await this.getDocumentCounts(folders.map((f) => f.id));

    const byId = new Map<number, any>();
    folders.forEach((f) =>
      byId.set(f.id, {
        id: f.id,
        name: f.name,
        departmentId: f.departmentId,
        parentFolderId: f.parentFolderId,
        documentCount: counts.get(f.id) || 0,
        children: [],
      }),
    );

    const roots: any[] = [];
    byId.forEach((node) => {
      if (node.parentFolderId && byId.has(node.parentFolderId)) {
        byId.get(node.parentFolderId).children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }

  async findOne(id: number, user: AuthUser): Promise<Folder> {
    return this.loadFolderOrFail(id, user);
  }

  async create(dto: CreateFolderDto, user: AuthUser): Promise<Folder> {
    let departmentId: number;

    if (user.roleName === RoleName.ADMIN) {
      if (!dto.departmentId) {
        throw new BadRequestException(
          await this.i18n.translate('folders.DEPARTMENT_ID_REQUIRED'),
        );
      }
      departmentId = dto.departmentId;
    } else {
      departmentId = user.departmentId;
    }

    await this.assertCanManage(user, departmentId);

    if (dto.parentFolderId) {
      const parent = await this.foldersRepository.findOne({
        where: { id: dto.parentFolderId },
        relations: {department : true}
      });
      if (!parent) {
        throw new NotFoundException(await this.i18n.translate('folders.PARENT_FOLDER_NOT_FOUND'));
      }
      if (parent.departmentId !== departmentId) {
        throw new BadRequestException(
          await this.i18n.translate('folders.PARENT_FOLDER_DEPARTMENT_MISMATCH'),
        );
      }
    }

    const folder = this.foldersRepository.create({
      name: dto.name,
      parentFolderId: dto.parentFolderId ?? null,
      departmentId,
      createdById: user.userId,
    });

    const savedFolder = await this.foldersRepository.save(folder);

    const fullyLoadedFolder = await this.foldersRepository.findOne({
      where: { id: savedFolder.id },
      relations: {parentFolder : true, department : true},
    });

    const departmentName = fullyLoadedFolder?.department?.name || `Department #${departmentId}`;
    
    let parentDetails = '';
    if (dto.parentFolderId) {
      const parentName = fullyLoadedFolder?.parentFolder?.name || `Folder #${dto.parentFolderId}`;
      parentDetails = ' ' + await this.i18n.translate('folders.PARENT_FOLDER_DETAILS', {
        args: { parentName }
      });
    }

    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(user),
      action: ActivityAction.FOLDER_CREATE,
      targetType: 'Folder',
      targetId: savedFolder.id,
      description: await this.i18n.translate('folders.CREATE_LOG', {
        args: { 
          folderName: savedFolder.name, 
          departmentName,
          parentDetails
        }
      }),
    });

    return savedFolder;
  }

  async update(
    id: number,
    dto: UpdateFolderDto,
    user: AuthUser,
  ): Promise<Folder> {
    const folder = await this.loadFolderOrFail(id, user);
    await this.assertCanManage(user, folder.departmentId);
    
    const oldName = folder.name;
    folder.name = dto.name;
    const updatedFolder = await this.foldersRepository.save(folder);

    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(user),
      action: ActivityAction.SETTINGS_UPDATE,
      targetType: 'Folder',
      targetId: id,
      description: await this.i18n.translate('folders.UPDATE_LOG', {
        args: { oldName, newName: dto.name }
      }),
    });

    return updatedFolder;
  }

  async remove(id: number, user: AuthUser): Promise<void> {
    const folder = await this.foldersRepository.findOne({ 
      where: { id },
      relations: {department : true}
    });
    if (!folder) {
      throw new NotFoundException(await this.i18n.translate('folders.FOLDER_NOT_FOUND'));
    }

    await this.assertCanManage(user, folder.departmentId);

    const childCount = await this.foldersRepository.count({
      where: { parentFolderId: id },
    });
    if (childCount > 0) {
      throw new BadRequestException(
        await this.i18n.translate('folders.FOLDER_HAS_SUBFOLDERS'),
      );
    }

    const documentCount = await this.foldersRepository
      .createQueryBuilder('f')
      .leftJoin('f.documents', 'd')
      .where('f.id = :id', { id })
      .andWhere('d.id IS NOT NULL')
      .andWhere('d.is_deleted = false')
      .getCount();
    if (documentCount > 0) {
      throw new BadRequestException(
        await this.i18n.translate('folders.FOLDER_HAS_DOCUMENTS'),
      );
    }

    const folderName = folder.name;
    const departmentName = folder.department?.name || `Department #${folder.departmentId}`;
    
    await this.foldersRepository.remove(folder);

    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(user),
      action: ActivityAction.FOLDER_DELETE,
      targetType: 'Folder',
      targetId: id,
      description: await this.i18n.translate('folders.DELETE_LOG', {
        args: { folderName, departmentName }
      }),
    });
  }
}