import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { ActivityLogService } from '../activity-logs/activity-log.service';
import { ActivityAction } from '../activity-logs/activity-action.enum';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { I18nService } from 'nestjs-i18n';

export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private activityLogService: ActivityLogService,
    private i18n: I18nService,
  ) {}

  async register(dto: RegisterDto, meta: RequestMeta = {}) {
    const user = await this.usersService.register(dto);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role?.name,
      departmentId: user.departmentId ?? null,
    };

    const accessToken = this.jwtService.sign(payload);

    void this.activityLogService.log({
      actor: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name as any || 'Employee',
        departmentId: user.departmentId ?? null,
      },
      action: ActivityAction.REGISTER,
      targetType: 'User',
      targetId: user.id,
      description: await this.i18n.translate('validation.REGISTER_LOG', {
        args: { userName: user.name }
      }),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return {
      accessToken,
      mustChangePassword: false,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name,
        departmentId: user.departmentId,
        department: user.department?.name ?? null,
      },
    };
  }

  async login(dto: LoginDto, meta: RequestMeta = {}) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      void this.activityLogService.log({
        actor: null,
        action: ActivityAction.LOGIN_FAILED,
        description: await this.i18n.translate('validation.LOGIN_FAILED_UNKNOWN_LOG', {
          args: { email: dto.email }
        }),
        metadata: { attemptedEmail: dto.email },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new UnauthorizedException(await this.i18n.translate('validation.INVALID_CREDENTIALS'));
    }

    if (!user.isActive) {
      void this.activityLogService.log({
        actor: this.activityLogService.toActorSnapshot(user),
        action: ActivityAction.LOGIN_FAILED,
        description: await this.i18n.translate('validation.LOGIN_FAILED_DEACTIVATED_LOG', {
          args: { email: user.email }
        }),
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new ForbiddenException(await this.i18n.translate('validation.ACCOUNT_DEACTIVATED'));
    }

    const passwordValid = await this.usersService.validatePassword(
      user,
      dto.password,
    );
    if (!passwordValid) {
      void this.activityLogService.log({
        actor: this.activityLogService.toActorSnapshot(user),
        action: ActivityAction.LOGIN_FAILED,
        description: await this.i18n.translate('validation.LOGIN_FAILED_PASSWORD_LOG'),
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new UnauthorizedException(await this.i18n.translate('validation.INVALID_CREDENTIALS'));
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role?.name,
      departmentId: user.departmentId ?? null,
    };

    const accessToken = this.jwtService.sign(payload);

    void this.activityLogService.log({
      actor: this.activityLogService.toActorSnapshot(user),
      action: ActivityAction.LOGIN,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return {
      accessToken,
      mustChangePassword: user.mustChangePassword,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name,
        departmentId: user.departmentId,
        department: user.department?.name ?? null,
      },
    };
  }

  // Make logout async to use await with translate
  async logout(authUser: AuthUser | null, meta: RequestMeta = {}) {
    if (authUser) {
      void this.activityLogService.log({
        actor: this.activityLogService.fromAuthUser(authUser),
        action: ActivityAction.LOGOUT,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
    }
    // Use await with translate instead of translateSync
    return { message: await this.i18n.translate('validation.LOGOUT_SUCCESS') };
  }

  async changePassword(userId: number, dto: ChangePasswordDto, meta: RequestMeta = {}) {
    const user = await this.usersService.findOne(userId);
    const valid = await this.usersService.validatePassword(
      user,
      dto.currentPassword,
    );
    if (!valid) {
      throw new UnauthorizedException(await this.i18n.translate('validation.CURRENT_PASSWORD_INCORRECT'));
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(await this.i18n.translate('validation.PASSWORD_SAME_AS_CURRENT'));
    }
    await this.usersService.updatePassword(userId, dto.newPassword);

    void this.activityLogService.log({
      actor: this.activityLogService.toActorSnapshot(user),
      action: ActivityAction.PASSWORD_CHANGED,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return { message: await this.i18n.translate('validation.PASSWORD_CHANGED_SUCCESS') };
  }

  async requestPasswordReset(email: string, meta: RequestMeta = {}) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return {
        message: await this.i18n.translate('validation.RESET_TOKEN_SENT'),
      };
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id, purpose: 'password_reset' },
      { expiresIn: '15m' },
    );

    void this.activityLogService.log({
      actor: this.activityLogService.toActorSnapshot(user),
      action: ActivityAction.PASSWORD_RESET_REQUESTED,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return {
      message: await this.i18n.translate('validation.RESET_TOKEN_SENT'),
      resetToken,
    };
  }

  async completePasswordReset(token: string, newPassword: string, meta: RequestMeta = {}) {
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch (e) {
      throw new BadRequestException(await this.i18n.translate('validation.INVALID_RESET_TOKEN'));
    }

    if (payload.purpose !== 'password_reset') {
      throw new BadRequestException(await this.i18n.translate('validation.INVALID_RESET_TOKEN'));
    }

    await this.usersService.updatePassword(payload.sub, newPassword);

    const user = await this.usersService.findOne(payload.sub);
    void this.activityLogService.log({
      actor: this.activityLogService.toActorSnapshot(user),
      action: ActivityAction.PASSWORD_RESET_COMPLETED,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return { message: await this.i18n.translate('validation.PASSWORD_RESET_SUCCESS') };
  }
}