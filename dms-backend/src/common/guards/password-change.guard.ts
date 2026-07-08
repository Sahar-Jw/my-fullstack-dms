import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SKIP_PASSWORD_CHECK_KEY } from '../decorators/skip-password-check.decorator';

/**
 * Blocks access to all endpoints until the user has changed their
 * initial/forced password, except for endpoints explicitly marked
 * @Public() or @SkipPasswordCheck().
 */
@Injectable()
export class PasswordChangeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
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
      throw new ForbiddenException(
        'Password change required before accessing this resource. Please change your password first.',
      );
    }

    return true;
  }
}
