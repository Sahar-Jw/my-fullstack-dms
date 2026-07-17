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

    // 🔥 1. تفعيل تسجيل الحسابات الجديدة بنجاح
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
      description: `${user.name} registered a new employee account`,
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
        description: `Failed login attempt for ${dto.email} (unknown account)`,
        metadata: { attemptedEmail: dto.email },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new UnauthorizedException('Invalid email ');
    }

    if (!user.isActive) {
      // 🔥 2. تسجيل محاولة تسجيل دخول فاشلة بسبب حساب مجمد أو معطل
      void this.activityLogService.log({
        actor: this.activityLogService.toActorSnapshot(user),
        action: ActivityAction.LOGIN_FAILED,
        description: `Failed login attempt: Account "${user.email}" is deactivated`,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new ForbiddenException('Your account has been deactivated. Please contact an administrator.');
    }

    const passwordValid = await this.usersService.validatePassword(
      user,
      dto.password,
    );
    if (!passwordValid) {
      void this.activityLogService.log({
        actor: this.activityLogService.toActorSnapshot(user),
        action: ActivityAction.LOGIN_FAILED,
        description: `Failed login attempt (wrong password)`,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new UnauthorizedException('Invalid password');
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

  // Now takes the real AuthUser shape from req.user (JWT payload) instead
  // of a made-up actor shape — the field names (userId, roleName) match
  // what JwtStrategy.validate() actually returns.
  logout(authUser: AuthUser | null, meta: RequestMeta = {}) {
    if (authUser) {
      void this.activityLogService.log({
        actor: this.activityLogService.fromAuthUser(authUser),
        action: ActivityAction.LOGOUT,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
    }
    return { message: 'Logged out successfully' };
  }

  async changePassword(userId: number, dto: ChangePasswordDto, meta: RequestMeta = {}) {
    const user = await this.usersService.findOne(userId);
    const valid = await this.usersService.validatePassword(
      user,
      dto.currentPassword,
    );
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }
    await this.usersService.updatePassword(userId, dto.newPassword);

    void this.activityLogService.log({
      actor: this.activityLogService.toActorSnapshot(user),
      action: ActivityAction.PASSWORD_CHANGED,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return { message: 'Password changed successfully' };
  }

  async requestPasswordReset(email: string, meta: RequestMeta = {}) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return {
        message:
          'If an account with that email exists, a password reset token has been generated.',
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
      message:
        'If an account with that email exists, a password reset token has been generated.',
      resetToken,
    };
  }

  async completePasswordReset(token: string, newPassword: string, meta: RequestMeta = {}) {
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch (e) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (payload.purpose !== 'password_reset') {
      throw new BadRequestException('Invalid reset token');
    }

    await this.usersService.updatePassword(payload.sub, newPassword);

    const user = await this.usersService.findOne(payload.sub);
    void this.activityLogService.log({
      actor: this.activityLogService.toActorSnapshot(user),
      action: ActivityAction.PASSWORD_RESET_COMPLETED,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return { message: 'Password has been reset successfully. Please log in.' };
  }
}
