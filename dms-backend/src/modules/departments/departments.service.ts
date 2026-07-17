import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ActivityLogService } from '../activity-logs/activity-log.service';
import { ActivityAction } from '../activity-logs/activity-action.enum';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private departmentsRepository: Repository<Department>,
    private readonly activityLogService: ActivityLogService,
    private readonly i18n: I18nService, // Add i18n service
  ) {}

  findAll(): Promise<Department[]> {
    return this.departmentsRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<Department> {
    const department = await this.departmentsRepository.findOne({
      where: { id },
    });
    if (!department) {
      throw new NotFoundException(await this.i18n.translate('validation.DEPARTMENT_NOT_FOUND'));
    }
    return department;
  }

  async create(dto: CreateDepartmentDto, actor: AuthUser): Promise<Department> {
    const department = this.departmentsRepository.create(dto);
    const savedDept = await this.departmentsRepository.save(department);

    // Log with translation
    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(actor),
      action: ActivityAction.DEPARTMENT_CREATE,
      targetType: 'Department',
      targetId: savedDept.id,
      description: await this.i18n.translate('validation.DEPARTMENT_CREATE_LOG', {
        args: { departmentName: savedDept.name }
      }),
    });

    return savedDept;
  }

  async update(id: number, dto: UpdateDepartmentDto, actor: AuthUser): Promise<Department> {
    const department = await this.findOne(id);
    const oldName = department.name;

    Object.assign(department, dto);
    const updatedDept = await this.departmentsRepository.save(department);

    // Log with translation
    let description = await this.i18n.translate('validation.DEPARTMENT_UPDATE_LOG', {
      args: { oldName }
    });
    
    if (dto.name) {
      description += ' ' + await this.i18n.translate('validation.DEPARTMENT_RENAMED_LOG', {
        args: { newName: dto.name }
      });
    }

    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(actor),
      action: ActivityAction.DEPARTMENT_UPDATE,
      targetType: 'Department',
      targetId: id,
      description,
    });

    return updatedDept;
  }

  async remove(id: number, actor: AuthUser): Promise<void> {
    const department = await this.findOne(id);
    const usersCount = await this.departmentsRepository
      .createQueryBuilder('d')
      .leftJoin('d.users', 'u')
      .where('d.id = :id', { id })
      .andWhere('u.id IS NOT NULL')
      .getCount();
    
    if (usersCount > 0) {
      throw new BadRequestException(
        await this.i18n.translate('validation.DEPARTMENT_HAS_USERS'),
      );
    }

    const deptName = department.name;
    await this.departmentsRepository.remove(department);

    // Log with translation
    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(actor),
      action: ActivityAction.DEPARTMENT_DELETE,
      targetType: 'Department',
      targetId: id,
      description: await this.i18n.translate('validation.DEPARTMENT_DELETE_LOG', {
        args: { departmentName: deptName }
      }),
    });
  }
}