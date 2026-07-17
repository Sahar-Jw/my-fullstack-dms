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

// 1. استيراد خدمات الأنشطة والـ Enum
import { ActivityLogService } from '../activity-logs/activity-log.service';
import { ActivityAction } from '../activity-logs/activity-action.enum';

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(Folder)
    private foldersRepository: Repository<Folder>,

    // 2. حقن خدمة الأنشطة هنا داخل الباني
    private readonly activityLogService: ActivityLogService,
  ) {}

  private assertCanManage(user: AuthUser, departmentId: number) {
    if (user.roleName === RoleName.ADMIN) return;
    if (user.roleName === RoleName.MANAGER) {
      if (user.departmentId !== departmentId) {
        throw new ForbiddenException(
          'Managers can only manage folders within their own department',
        );
      }
      return;
    }
    throw new ForbiddenException(
      'Employees do not have permission to manage folders (view only)',
    );
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

  /**
   * Returns, per folder id, the count of non-deleted documents directly
   * inside that folder (not including documents in subfolders).
   */
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
    const folder = await this.foldersRepository.findOne({ where: { id } });
    if (!folder) {
      throw new NotFoundException(`Folder with id ${id} not found`);
    }
    if (
      user.roleName !== RoleName.ADMIN &&
      folder.departmentId !== user.departmentId
    ) {
      throw new ForbiddenException(
        'You do not have access to folders outside your department',
      );
    }
    return folder;
  }

  // async create(dto: CreateFolderDto, user: AuthUser): Promise<Folder> {
  //   let departmentId: number;

  //   if (user.roleName === RoleName.ADMIN) {
  //     if (!dto.departmentId) {
  //       throw new BadRequestException(
  //         'departmentId is required when an Admin creates a folder',
  //       );
  //     }
  //     departmentId = dto.departmentId;
  //   } else {
  //     departmentId = user.departmentId;
  //   }

  //   this.assertCanManage(user, departmentId);

  //   if (dto.parentFolderId) {
  //     const parent = await this.foldersRepository.findOne({
  //       where: { id: dto.parentFolderId },
  //     });
  //     if (!parent) {
  //       throw new NotFoundException('Parent folder not found');
  //     }
  //     if (parent.departmentId !== departmentId) {
  //       throw new BadRequestException(
  //         'Parent folder must belong to the same department',
  //       );
  //     }
  //   }

  //   const folder = this.foldersRepository.create({
  //     name: dto.name,
  //     parentFolderId: dto.parentFolderId ?? null,
  //     departmentId,
  //     createdById: user.userId,
  //   });

  //   const savedFolder = await this.foldersRepository.save(folder);

  //   // 🔥 3. تسجيل عملية إنشاء مجلد جديد في الـ Logs
  //   await this.activityLogService.log({
  //     actor: this.activityLogService.fromAuthUser(user),
  //     action: ActivityAction.FOLDER_CREATE,
  //     targetType: 'Folder',
  //     targetId: savedFolder.id,
  //     description: `Created folder "${savedFolder.name}" in department #${departmentId}` + 
  //       (dto.parentFolderId ? ` under parent folder #${dto.parentFolderId}` : ''),
  //   });

  //   return savedFolder;
  // }

    async create(dto: CreateFolderDto, user: AuthUser): Promise<Folder> {
    let departmentId: number;

    if (user.roleName === RoleName.ADMIN) {
      if (!dto.departmentId) {
        throw new BadRequestException(
          'departmentId is required when an Admin creates a folder',
        );
      }
      departmentId = dto.departmentId;
    } else {
      departmentId = user.departmentId;
    }

    this.assertCanManage(user, departmentId);

    if (dto.parentFolderId) {
      const parent = await this.foldersRepository.findOne({
        where: { id: dto.parentFolderId },
      });
      if (!parent) {
        throw new NotFoundException('Parent folder not found');
      }
      if (parent.departmentId !== departmentId) {
        throw new BadRequestException(
          'Parent folder must belong to the same department',
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

    // 1. 🔥 جلب اسم القسم والملف الأب بالكامل عبر استخدام الـ relations المباشرة لفك شفرة الأسماء النصية
    const fullyLoadedFolder = await this.foldersRepository.findOne({
      where: { id: savedFolder.id },
      relations: ['parentFolder'], // 👈 أضفنا علاقة parentFolder هنا لجلب الاسم الأب النصي
    });

    const departmentName = fullyLoadedFolder?.department?.name || `Department #${departmentId}`;
    
    // 2. التقاط اسم المجلد الأب إذا كان متوفراً في الطلب
    let parentDetails = '';
    if (dto.parentFolderId) {
      const parentName = fullyLoadedFolder?.parentFolder?.name || `Folder #${dto.parentFolderId}`;
      parentDetails = ` under parent folder "${parentName}"`; // 👈 صياغة الاسم داخل علامات اقتباس
    }

    // 3. 🔥 تسجيل عملية إنشاء المجلد مع عرض الاسم النصي للقسم والمجلد الأب في جدول الأنشطة
    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(user),
      action: ActivityAction.FOLDER_CREATE,
      targetType: 'Folder',
      targetId: savedFolder.id,
      description: `Created folder "${savedFolder.name}" in department "${departmentName}"${parentDetails}`,
    });

    return savedFolder;
  }



  async update(
    id: number,
    dto: UpdateFolderDto,
    user: AuthUser,
  ): Promise<Folder> {
    const folder = await this.findOne(id, user);
    this.assertCanManage(user, folder.departmentId);
    
    const oldName = folder.name;
    folder.name = dto.name;
    const updatedFolder = await this.foldersRepository.save(folder);

    // 🔥 4. تسجيل تعديل اسم المجلد في الـ Logs
    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(user),
      action: ActivityAction.SETTINGS_UPDATE, // نستخدم SETTINGS_UPDATE أو تحديث عام لتتبع التعديلات الإدارية للمجلدات
      targetType: 'Folder',
      targetId: id,
      description: `Renamed folder from "${oldName}" to "${dto.name}"`,
    });

    return updatedFolder;
  }

   async remove(id: number, user: AuthUser): Promise<void> {
    // 1. استخدام دالة findOne المباشرة من الـ repository لقراءة المجلد مع علاقات الـ eager المتاحة تلقائياً
    const folder = await this.foldersRepository.findOne({ where: { id } });
    if (!folder) {
      throw new NotFoundException(`Folder with id ${id} not found`);
    }

    // التحقق من الصلاحيات الإدارية كالمعتاد
    this.assertCanManage(user, folder.departmentId);

    const childCount = await this.foldersRepository.count({
      where: { parentFolderId: id },
    });
    if (childCount > 0) {
      throw new BadRequestException(
        'Cannot delete a folder that contains subfolders',
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
        'Cannot delete a folder that still contains documents',
      );
    }

    const folderName = folder.name;
    
    // 2. 🔥 التقاط الاسم النصي الصريح للقسم بفضل ميزة الـ eager المدمجة في الـ Entity الخاص بك
    const departmentName = folder.department?.name || `Department #${folder.departmentId}`;
    
    await this.foldersRepository.remove(folder);

    // 🔥 3. تسجيل عملية الحذف وعرض الاسم النصي (مثل "Finance" أو "Frontend") مباشرة داخل جدول الأنشطة
    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(user),
      action: ActivityAction.FOLDER_DELETE,
      targetType: 'Folder',
      targetId: id,
      description: `Deleted folder "${folderName}" from department "${departmentName}"`, // 👈 ستعرض الاسم الحقيقي الآن فوراً
    });
  }


}
