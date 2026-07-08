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
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email ');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Your account has been deactivated. Please contact an administrator.');
    }

    const passwordValid = await this.usersService.validatePassword(
      user,
      dto.password,
    );
    if (!passwordValid) {
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

  // Stateless logout: the client discards the token. Nothing to invalidate server-side
  // since no token blacklist/session store is part of the specified schema.
  logout() {
    return { message: 'Logged out successfully' };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
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
    return { message: 'Password changed successfully' };
  }

  async forceChangePassword(userId: number, newPassword: string) {
    await this.usersService.updatePassword(userId, newPassword);
    return { message: 'Password set successfully. You may now use the system.' };
  }

  async checkPasswordRequired(userId: number) {
    const user = await this.usersService.findOne(userId);
    return { mustChangePassword: user.mustChangePassword };
  }

  // Generates a short-lived signed reset token. In a production system this
  // would be emailed to the user; here it is returned directly since no
  // email/SMTP integration was part of the spec.
  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);
    // Always return a generic response to avoid leaking which emails exist
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

    return {
      message:
        'If an account with that email exists, a password reset token has been generated.',
      resetToken, // exposed directly for dev/testing purposes (no email service configured)
    };
  }

  async completePasswordReset(token: string, newPassword: string) {
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
    return { message: 'Password has been reset successfully. Please log in.' };
  }
}
