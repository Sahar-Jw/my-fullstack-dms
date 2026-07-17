import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SKIP_PASSWORD_CHECK_KEY } from '../decorators/skip-password-check.decorator';
import { I18nService } from 'nestjs-i18n';

/**
 * Blocks access to all endpoints until the user has changed their
 * initial/forced password, except for endpoints explicitly marked
 * @Public() or @SkipPasswordCheck().
 */
@Injectable()
export class PasswordChangeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly i18n: I18nService,
  ) {}

  // Make canActivate async
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) {
      return true;
    }

    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_PASSWORD_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skip) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (user && user.mustChangePassword) {
      const message = await this.i18n.translate('guards.PASSWORD_CHANGE_REQUIRED');
      throw new ForbiddenException(message);
    }

    return true;
  }
}