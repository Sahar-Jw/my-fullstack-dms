import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { I18nService } from 'nestjs-i18n';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  constructor(private readonly i18n: I18nService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';
    let translatedMessage: string | string[] = 'Internal server error';

    try {
      if (exception instanceof HttpException) {
        status = exception.getStatus();
        const res = exception.getResponse();
        
        if (typeof res === 'string') {
          message = res;
          error = exception.name;
        } else if (typeof res === 'object') {
          const resObj = res as any;
          message = resObj.message || exception.message;
          error = resObj.error || exception.name;
        }

        // Try to translate the message
        if (typeof message === 'string') {
          translatedMessage = await this.translateMessage(message, status);
        } else if (Array.isArray(message)) {
          translatedMessage = await Promise.all(
            message.map(msg => this.translateMessage(msg, status))
          );
        }
      } else if (exception instanceof Error) {
        message = exception.message;
        error = exception.name;
        translatedMessage = await this.translateMessage(message, status);
      }
    } catch (translationError) {
      // If translation fails, use original message
      translatedMessage = message;
    }

    this.logger.error(
      `${request.method} ${request.url} -> ${status}: ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      error,
      message: translatedMessage,
    });
  }

  private async translateMessage(message: string, status: number): Promise<string> {
    // If message is empty, return status-based message
    if (!message) {
      return this.getStatusFallback(status);
    }

    // Try to translate the message as-is
    try {
      const translated: string = await this.i18n.translate(message);
      if (translated && translated !== message) {
        return translated;
      }
    } catch (e) {
      // Not a translation key, continue
    }

    // Try common error messages
    const commonMessages: Record<string, string> = {
      'Internal Server Error': 'errors.INTERNAL_SERVER_ERROR',
      'Bad Request': 'errors.BAD_REQUEST',
      'Unauthorized': 'errors.UNAUTHORIZED',
      'Forbidden': 'errors.FORBIDDEN',
      'Not Found': 'errors.NOT_FOUND',
      'Conflict': 'errors.CONFLICT',
      'Too Many Requests': 'errors.TOO_MANY_REQUESTS',
      'Invalid credentials': 'validation.INVALID_CREDENTIALS',
      'User not found': 'users.USER_NOT_FOUND',
      'Email is already in use': 'users.EMAIL_ALREADY_EXISTS',
      'Password is too short': 'validation.PASSWORD_TOO_SHORT',
      'Passwords do not match': 'profile.PASSWORDS_DO_NOT_MATCH',
      'Account is deactivated': 'validation.ACCOUNT_DEACTIVATED',
      'Session expired': 'validation.SESSION_EXPIRED',
      'Permission denied': 'validation.PERMISSION_DENIED',
      'Current password is incorrect': 'validation.CURRENT_PASSWORD_INCORRECT',
      'Document not found': 'documents.DOCUMENT_NOT_FOUND',
      'Folder not found': 'documents.FOLDER_NOT_FOUND',
      'Attachment not found': 'documents.ATTACHMENT_NOT_FOUND',
      'Category not found': 'validation.CATEGORY_NOT_FOUND',
      'Department not found': 'validation.DEPARTMENT_NOT_FOUND',
      'Role not found': 'roles.ROLE_NOT_FOUND',
    };

    if (commonMessages[message]) {
      try {
        const translated: string = await this.i18n.translate(commonMessages[message]);
        if (translated) {
          return translated;
        }
      } catch (e) {
        // Fall through to fallback
      }
    }

    // Fallback to status-based message
    return this.getStatusFallback(status);
  }

  private getStatusFallback(status: number): string {
    const fallbacks: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'Bad request',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not found',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal server error',
      [HttpStatus.TOO_MANY_REQUESTS]: 'Too many requests',
    };
    return fallbacks[status] || 'Internal server error';
  }
}