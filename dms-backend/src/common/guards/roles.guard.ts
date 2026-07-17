import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, RoleName } from '../decorators/roles.decorator';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly i18n: I18nService,
  ) {}

  // Make canActivate async
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @Roles() decorator means any authenticated user can access it
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.roleName) {
      const message = await this.i18n.translate('errors.FORBIDDEN');
      throw new ForbiddenException(message);
    }

    const hasRole = requiredRoles.includes(user.roleName);
    if (!hasRole) {
      const message = await this.i18n.translate('errors.FORBIDDEN');
      throw new ForbiddenException(message);
    }

    return true;
  }
}