import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { I18nService } from 'nestjs-i18n';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionsFilter');

  constructor(private readonly i18n: I18nService) {}

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message: string | string[] =
      exceptionResponse && typeof exceptionResponse === 'object'
        ? (exceptionResponse as any).message
        : exception instanceof Error
          ? exception.message
          : 'An unexpected error occurred on the server.';

    // Translate the message
    let translatedMessage: string | string[] = message;
    try {
      if (typeof message === 'string') {
        translatedMessage = await this.translateMessage(message, status);
      } else if (Array.isArray(message)) {
        translatedMessage = await Promise.all(
          message.map(msg => this.translateMessage(msg, status))
        );
      }
    } catch (error) {
      // If translation fails, keep original message
      translatedMessage = message;
    }

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} -> ${status}: ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      success: false,
      message: translatedMessage,
    });
  }

  private async translateMessage(message: string, status: number): Promise<string> {
    // If message is empty, return status-based fallback
    if (!message) {
      return this.getStatusFallback(status);
    }

    // Try to translate the message as-is (if it's already a translation key)
    try {
      const translated: string = await this.i18n.translate(message);
      if (translated && translated !== message) {
        return translated;
      }
    } catch (error) {
      // Not a translation key, continue
    }

    // Common error messages mapping to translation keys
    const translationMap: Record<string, string> = {
      // HTTP status errors
      'Internal Server Error': 'errors.INTERNAL_SERVER_ERROR',
      'Bad Request': 'errors.BAD_REQUEST',
      'Unauthorized': 'errors.UNAUTHORIZED',
      'Forbidden': 'errors.FORBIDDEN',
      'Not Found': 'errors.NOT_FOUND',
      'Conflict': 'errors.CONFLICT',
      'Too Many Requests': 'errors.TOO_MANY_REQUESTS',
      'Validation failed': 'errors.VALIDATION_ERROR',
      
      // Common validation messages
      'Invalid email': 'validation.INVALID_EMAIL',
      'Email is invalid': 'validation.INVALID_EMAIL',
      'Password is too short': 'validation.PASSWORD_TOO_SHORT',
      'Passwords do not match': 'profile.PASSWORDS_DO_NOT_MATCH',
      'Email is already in use': 'users.EMAIL_ALREADY_EXISTS',
      'User not found': 'users.USER_NOT_FOUND',
      'Invalid credentials': 'validation.INVALID_CREDENTIALS',
      'Account is deactivated': 'validation.ACCOUNT_DEACTIVATED',
      'Session expired': 'validation.SESSION_EXPIRED',
      'Permission denied': 'validation.PERMISSION_DENIED',
      'Current password is incorrect': 'validation.CURRENT_PASSWORD_INCORRECT',
      'New password must be different': 'validation.PASSWORD_SAME_AS_CURRENT',
      
      // Document errors
      'Document not found': 'documents.DOCUMENT_NOT_FOUND',
      'Folder not found': 'documents.FOLDER_NOT_FOUND',
      'Attachment not found': 'documents.ATTACHMENT_NOT_FOUND',
      'Version not found': 'documents.VERSION_NOT_FOUND',
      'No file uploaded': 'profile.NO_FILE_UPLOADED',
      
      // Category errors
      'Category not found': 'validation.CATEGORY_NOT_FOUND',
      
      // Department errors
      'Department not found': 'validation.DEPARTMENT_NOT_FOUND',
      
      // Role errors
      'Role not found': 'roles.ROLE_NOT_FOUND',
    };

    // Check the translation map
    if (translationMap[message]) {
      try {
        const translated: string = await this.i18n.translate(translationMap[message]);
        if (translated) {
          return translated;
        }
      } catch (error) {
        // Translation failed, continue to fallback
      }
    }

    // Try to translate common error patterns
    // Example: "Validation failed for field: email" -> "Validation error"
    const validationPatterns = [
      'Validation failed',
      'Validation error',
      'validation failed',
      'validation error',
    ];
    for (const pattern of validationPatterns) {
      if (message.includes(pattern)) {
        try {
          const translated: string = await this.i18n.translate('errors.VALIDATION_ERROR');
          if (translated) {
            return translated;
          }
        } catch (error) {
          // Continue
        }
        break;
      }
    }

    // Return status-based fallback
    return this.getStatusFallback(status);
  }

  private getStatusFallback(status: number): string {
    const statusMap: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'Bad request',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not found',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal server error',
      [HttpStatus.TOO_MANY_REQUESTS]: 'Too many requests',
    };
    return statusMap[status] || 'Internal server error';
  }
}