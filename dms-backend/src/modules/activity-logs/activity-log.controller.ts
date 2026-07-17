import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/enums/role.enum';
import { ActivityLogService } from './activity-log.service';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';

@Controller('activity-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  findAll(@Req() req: Request, @Query() query: QueryActivityLogDto) {
    // req.user is the real AuthUser shape (userId/roleName), not the
    // id/role shape findForRequester expects — adapt it explicitly rather
    // than casting, since the field names genuinely differ.
    const authUser = req.user!; // JwtAuthGuard guarantees this exists
    const requester = {
      id: authUser.userId,
      role: authUser.roleName as RoleName,
      departmentId: authUser.departmentId,
    };

    return this.activityLogService.findForRequester(requester, query);
  }
}