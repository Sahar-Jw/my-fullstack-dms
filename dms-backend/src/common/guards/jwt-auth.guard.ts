import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { I18nService } from 'nestjs-i18n';

/**
 * NFR-04: يجب تأمين جميع طلبات API باستخدام JWT للتحقق من الهوية والصلاحية.
 * Registered globally in AppModule; routes decorated with @Public() skip it
 * (e.g. login).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private readonly i18n: I18nService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  // Keep handleRequest synchronous - use translateSync or get translation differently
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      // Use the current language from the request context if available
      // Or use a fallback method to get the translation
      const message = this.getTranslation('errors.UNAUTHORIZED');
      throw new UnauthorizedException(message);
    }
    return user;
  }

  private getTranslation(key: string): string {
    try {
      // Try to get translation from i18n context
      const { I18nContext } = require('nestjs-i18n');
      const i18nContext = I18nContext.current();
      if (i18nContext) {
        return i18nContext.translate(key);
      }
    } catch (e) {
      // Fallback: use a default message
    }
    
    // Fallback to a hardcoded message if translation fails
    const fallbackMessages: Record<string, string> = {
      'errors.UNAUTHORIZED': 'Unauthorized. Please log in first.',
    };
    return fallbackMessages[key] || 'Unauthorized';
  }
}