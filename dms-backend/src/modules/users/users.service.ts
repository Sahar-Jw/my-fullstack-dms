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
import { ActivityLogService } from '../activity-logs/activity-log.service';
import { ActivityAction } from '../activity-logs/activity-action.enum';
import { I18nService } from 'nestjs-i18n';

const SALT_ROUNDS = 10;
const DEFAULT_ROLE_NAME = RoleName.EMPLOYEE;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private rolesService: RolesService,
    private departmentsService: DepartmentsService,
    private readonly activityLogService: ActivityLogService,
    private readonly i18n: I18nService,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(await this.i18n.translate('users.USER_NOT_FOUND'));
    }
    return user;
  }

  findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async register(dto: {
    name: string;
    email: string;
    password: string;
    departmentId: number;
  }): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(await this.i18n.translate('users.EMAIL_ALREADY_EXISTS'));
    }

    const defaultRole = await this.rolesService.findByName(DEFAULT_ROLE_NAME);
    if (!defaultRole) {
      throw new BadRequestException(await this.i18n.translate('users.DEFAULT_ROLE_NOT_CONFIGURED'));
    }
    if (defaultRole.name !== RoleName.EMPLOYEE) {
      throw new Error('DEFAULT_ROLE_NAME must resolve to the Employee role');
    }

    const department = await this.departmentsService
      .findOne(dto.departmentId)
      .catch(() => null);
    if (!department) {
      throw new BadRequestException(await this.i18n.translate('users.INVALID_DEPARTMENT'));
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
      description: await this.i18n.translate('users.REGISTER_LOG', {
        args: { email: savedUser.email }
      }),
    });

    return savedUser;
  }

  async update(id: number, dto: UpdateUserDto, actor?: AuthUser): Promise<User> {
    const user = await this.findOne(id);

    if (dto.email && dto.email !== user.email) {
      const existing = await this.findByEmail(dto.email);
      if (existing) {
        throw new ConflictException(await this.i18n.translate('users.EMAIL_ALREADY_EXISTS'));
      }
    }

    const patch: Partial<User> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.email !== undefined) patch.email = dto.email;
    if (dto.roleId !== undefined) patch.roleId = dto.roleId;
    if (dto.departmentId !== undefined) patch.departmentId = dto.departmentId;

    await this.usersRepository.update(id, patch);
    const updatedUser = await this.findOne(id);

    await this.activityLogService.log({
      actor: actor ? this.activityLogService.fromAuthUser(actor) : null,
      action: ActivityAction.USER_UPDATE,
      targetType: 'User',
      targetId: id,
      description: await this.i18n.translate('users.UPDATE_LOG', {
        args: { email: user.email }
      }),
    });

    return updatedUser;
  }

  async remove(id: number, actor?: AuthUser): Promise<void> {
    const user = await this.findOne(id);
    const userEmail = user.email;
    await this.usersRepository.remove(user);

    await this.activityLogService.log({
      actor: actor ? this.activityLogService.fromAuthUser(actor) : null,
      action: ActivityAction.USER_UPDATE,
      targetType: 'User',
      targetId: id,
      description: await this.i18n.translate('users.DELETE_LOG', {
        args: { email: userEmail }
      }),
    });
  }

  async toggleStatus(id: number, actor?: AuthUser): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = !user.isActive;
    const savedUser = await this.usersRepository.save(user);

    const statusText = savedUser.isActive 
      ? await this.i18n.translate('users.ACTIVE') 
      : await this.i18n.translate('users.INACTIVE');

    await this.activityLogService.log({
      actor: actor ? this.activityLogService.fromAuthUser(actor) : null,
      action: ActivityAction.USER_STATUS_TOGGLE,
      targetType: 'User',
      targetId: id,
      description: await this.i18n.translate('users.STATUS_TOGGLE_LOG', {
        args: { email: user.email, status: statusText }
      }),
    });

    return savedUser;
  }

  async updatePassword(id: number, newPassword: string, actor?: AuthUser): Promise<User> {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException(
        await this.i18n.translate('users.PASSWORD_MIN_LENGTH'),
      );
    }
    const user = await this.findOne(id);
    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.mustChangePassword = false;
    user.passwordChangedAt = new Date();
    
    const savedUser = await this.usersRepository.save(user);

    await this.activityLogService.log({
      actor: actor ? this.activityLogService.fromAuthUser(actor) : { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: RoleName.EMPLOYEE, 
        departmentId: user.departmentId 
      },
      action: ActivityAction.PASSWORD_CHANGED,
      targetType: 'User',
      targetId: id,
      description: await this.i18n.translate('users.PASSWORD_CHANGE_LOG', {
        args: { email: user.email }
      }),
    });

    return savedUser;
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  // --- Password reset token helpers -------------------------------------
  // The raw token is only ever emailed to the user; only its hash + expiry
  // are persisted here, so a leaked database can't be used to reset anyone's
  // password.

  async setPasswordResetToken(userId: number, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.usersRepository.update(userId, {
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: expiresAt,
    });
  }

  async findByValidResetTokenHash(tokenHash: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { resetPasswordTokenHash: tokenHash } });
    if (!user || !user.resetPasswordExpiresAt) return null;
    if (user.resetPasswordExpiresAt.getTime() < Date.now()) return null;
    return user;
  }

  async clearPasswordResetToken(userId: number): Promise<void> {
    await this.usersRepository.update(userId, {
      resetPasswordTokenHash: null,
      resetPasswordExpiresAt: null,
    });
  }
}