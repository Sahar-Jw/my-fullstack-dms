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

// 🔥 استيراد موديول سجلات الأنشطة والـ Enum الجديد لعمليات الأقسام
import { ActivityLogService } from '../activity-logs/activity-log.service';
import { ActivityAction } from '../activity-logs/activity-action.enum';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private departmentsRepository: Repository<Department>,

    // 🔥 حقن خدمة الأنشطة هنا داخل الباني
    private readonly activityLogService: ActivityLogService,
  ) {}

  findAll(): Promise<Department[]> {
    return this.departmentsRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<Department> {
    const department = await this.departmentsRepository.findOne({
      where: { id },
    });
    if (!department) {
      throw new NotFoundException(`Department not found`);
    }
    return department;
  }

  async create(dto: CreateDepartmentDto, actor: AuthUser): Promise<Department> {
    const department = this.departmentsRepository.create(dto);
    const savedDept = await this.departmentsRepository.save(department);

    // 🔥 تسجيل حركة إنشاء قسم جديد
    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(actor),
      action: ActivityAction.DEPARTMENT_CREATE,
      targetType: 'Department',
      targetId: savedDept.id,
      description: `Created new department: "${savedDept.name}"`,
    });

    return savedDept;
  }

  async update(id: number, dto: UpdateDepartmentDto, actor: AuthUser): Promise<Department> {
    const department = await this.findOne(id);
    const oldName = department.name;

    Object.assign(department, dto);
    const updatedDept = await this.departmentsRepository.save(department);

    // 🔥 تسجيل حركة تعديل بيانات أو اسم القسم
    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(actor),
      action: ActivityAction.DEPARTMENT_UPDATE,
      targetType: 'Department',
      targetId: id,
      description: `Updated department "${oldName}"` + (dto.name ? ` (Renamed to: "${dto.name}")` : ''),
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
        'Cannot delete a department that still has users assigned to it',
      );
    }

    const deptName = department.name;
    await this.departmentsRepository.remove(department);

    // 🔥 تسجيل حركة حذف القسم نهائياً
    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(actor),
      action: ActivityAction.DEPARTMENT_DELETE,
      targetType: 'Department',
      targetId: id,
      description: `Deleted department "${deptName}"`,
    });
  }
}
