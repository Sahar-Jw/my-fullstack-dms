// src/activity-logs/decorators/log-activity.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { ActivityAction } from '../activity-action.enum';

export const ACTIVITY_LOG_KEY = 'activity_log_meta';

export interface ActivityLogMeta {
  action: ActivityAction;
  targetType?: string;
  // Optional: derive a human-readable description from the request/response.
  describe?: (req: any, responseBody: any) => string;
}

export const LogActivity = (meta: ActivityLogMeta) => SetMetadata(ACTIVITY_LOG_KEY, meta);