import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { RolesService } from '../roles/roles.service';
import { DepartmentsService } from '../departments/departments.service';
import { RoleName } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';

// 1. استيراد موديول سجلات الأنشطة
import { ActivityLogService } from '../activity-logs/activity-log.service';
import { ActivityAction } from '../activity-logs/activity-action.enum';

const SALT_ROUNDS = 10;
const DEFAULT_ROLE_NAME = RoleName.EMPLOYEE;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private rolesService: RolesService,
    private departmentsService: DepartmentsService,
    
    // 2. حقن خدمة الأنشطة هنا
    private readonly activityLogService: ActivityLogService,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User not found`);
    }
    return user;
  }

  findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } });
  }

  /**
   * Public self-registration. Role is never taken from the caller — every
   * self-registered user gets the fixed default role. Only an authenticated
   * admin can change roles afterward, via update().
   */
  async register(dto: {
    name: string;
    email: string;
    password: string;
    departmentId: number;
  }): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const defaultRole = await this.rolesService.findByName(DEFAULT_ROLE_NAME);
    if (!defaultRole) {
      throw new BadRequestException('Default role is not configured');
    }
    if (defaultRole.name !== RoleName.EMPLOYEE) {
      throw new Error('DEFAULT_ROLE_NAME must resolve to the Employee role');
    }

    const department = await this.departmentsService
      .findOne(dto.departmentId)
      .catch(() => null);
    if (!department) {
      throw new BadRequestException('Invalid department');
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      roleId: defaultRole.id,
      departmentId: dto.departmentId,
      isActive: true,
      mustChangePassword: false,
    });

    const savedUser = await this.usersRepository.save(user);

    // 🔥 3. تسجيل عملية إنشاء حساب موظف جديد (تسجيل ذاتي)
    await this.activityLogService.log({
      actor: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        role: RoleName.EMPLOYEE,
        departmentId: savedUser.departmentId,
      },
      action: ActivityAction.REGISTER,
      targetType: 'User',
      targetId: savedUser.id,
      description: `New user self-registered account with email "${savedUser.email}"`,
    });

    return savedUser;
  }

  // أضفنا معامل `actor` هنا لنعرف أي أدمن قام بالتعديل
  async update(id: number, dto: UpdateUserDto, actor?: AuthUser): Promise<User> {
    const user = await this.findOne(id);

    if (dto.email && dto.email !== user.email) {
      const existing = await this.findByEmail(dto.email);
      if (existing) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    const patch: Partial<User> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.email !== undefined) patch.email = dto.email;
    if (dto.roleId !== undefined) patch.roleId = dto.roleId;
    if (dto.departmentId !== undefined) patch.departmentId = dto.departmentId;

    await this.usersRepository.update(id, patch);
    const updatedUser = await this.findOne(id);

    // 🔥 4. تسجيل تعديل بيانات مستخدم بواسطة الأدمن
    await this.activityLogService.log({
      actor: actor ? this.activityLogService.fromAuthUser(actor) : null,
      action: ActivityAction.USER_UPDATE,
      targetType: 'User',
      targetId: id,
      description: `Updated profile details for account "${user.email}"`,
    });

    return updatedUser;
  }

  async remove(id: number, actor?: AuthUser): Promise<void> {
    const user = await this.findOne(id);
    const userEmail = user.email;
    await this.usersRepository.remove(user);

    // 🔥 5. تسجيل حذف الحساب بالكامل
    await this.activityLogService.log({
      actor: actor ? this.activityLogService.fromAuthUser(actor) : null,
      action: ActivityAction.USER_UPDATE,
      targetType: 'User',
      targetId: id,
      description: `Permanently deleted user account "${userEmail}"`,
    });
  }

  async toggleStatus(id: number, actor?: AuthUser): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = !user.isActive;
    const savedUser = await this.usersRepository.save(user);

    // 🔥 6. تسجيل تجميد أو تفعيل حساب الموظف في الـ Logs
    await this.activityLogService.log({
      actor: actor ? this.activityLogService.fromAuthUser(actor) : null,
      action: ActivityAction.USER_STATUS_TOGGLE,
      targetType: 'User',
      targetId: id,
      description: `Toggled account status for "${user.email}". Current status: ${savedUser.isActive ? 'Active' : 'Inactive'}`,
    });

    return savedUser;
  }

  async updatePassword(id: number, newPassword: string, actor?: AuthUser): Promise<User> {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException(
        'Password must be at least 6 characters long',
      );
    }
    const user = await this.findOne(id);
    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.mustChangePassword = false;
    user.passwordChangedAt = new Date();
    
    const savedUser = await this.usersRepository.save(user);

    // 🔥 7. تسجيل حركة تغيير كلمة المرور للحساب
    await this.activityLogService.log({
      actor: actor ? this.activityLogService.fromAuthUser(actor) : user ? { id: user.id, name: user.name, email: user.email, role: RoleName.EMPLOYEE, departmentId: user.departmentId } : null,
      action: ActivityAction.PASSWORD_CHANGED,
      targetType: 'User',
      targetId: id,
      description: `Changed password for account "${user.email}"`,
    });

    return savedUser;
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }
}
