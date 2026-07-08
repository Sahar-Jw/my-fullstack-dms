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

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(Folder)
    private foldersRepository: Repository<Folder>,
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

  async getTree(user: AuthUser): Promise<any[]> {
    const folders = await this.findAll(user);
    const byId = new Map<number, any>();
    folders.forEach((f) =>
      byId.set(f.id, {
        id: f.id,
        name: f.name,
        departmentId: f.departmentId,
        parentFolderId: f.parentFolderId,
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

    return this.foldersRepository.save(folder);
  }

  async update(
    id: number,
    dto: UpdateFolderDto,
    user: AuthUser,
  ): Promise<Folder> {
    const folder = await this.findOne(id, user);
    this.assertCanManage(user, folder.departmentId);
    folder.name = dto.name;
    return this.foldersRepository.save(folder);
  }

  async remove(id: number, user: AuthUser): Promise<void> {
    const folder = await this.findOne(id, user);
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

    await this.foldersRepository.remove(folder);
  }
}
