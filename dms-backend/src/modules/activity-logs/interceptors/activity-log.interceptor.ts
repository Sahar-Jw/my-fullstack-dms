import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { ActivityLogService } from '../activity-log.service';
import { ACTIVITY_LOG_KEY, ActivityLogMeta } from '../decorators/log-activity.decorator';

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly activityLogService: ActivityLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.get<ActivityLogMeta | undefined>(ACTIVITY_LOG_KEY, context.getHandler());
    if (!meta) return next.handle();

    const req = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      tap((responseBody) => {
        if (!req.user) return;

        const targetId =
          (responseBody as any)?.id ??
          req.params?.id ??
          (Array.isArray(responseBody) ? (responseBody[0] as any)?.id : null) ??
          null;

        void this.activityLogService.log({
          actor: this.activityLogService.fromAuthUser(req.user),
          action: meta.action,
          targetType: meta.targetType,
          targetId,
          description: meta.describe ? meta.describe(req, responseBody) : undefined,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }),
    );
  }
}