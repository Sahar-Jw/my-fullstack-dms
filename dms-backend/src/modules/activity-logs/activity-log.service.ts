import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import { ActivityAction } from './activity-action.enum';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';
import { PaginatedResult } from './dto/paginated-result.dto';
import { RoleName } from '../../common/enums/role.enum';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { I18nService } from 'nestjs-i18n';

export interface ActorSnapshot {
  id: number;
  name: string;
  email: string;
  role: RoleName;
  departmentId: number | null;
}

export interface LogActivityInput {
  actor: ActorSnapshot | null;
  action: ActivityAction;
  targetType?: string;
  targetId?: string | number | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface RequestUser {
  id: number;
  role: RoleName;
  departmentId: number | null;
}

// Minimal shape needed from a TypeORM User entity (with a possibly-loose
// role.name: string) to build an ActorSnapshot.
interface UserLike {
  id: number;
  name: string;
  email: string;
  role?: { name: string } | null;
  departmentId?: number | null;
}

function assertValidRole(roleName: string | undefined, contextId: number | string): RoleName {
  if (!roleName || !Object.values(RoleName).includes(roleName as RoleName)) {
    throw new Error(`Cannot build activity log actor: subject ${contextId} has no valid role`);
  }
  return roleName as RoleName;
}

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(
    @InjectRepository(ActivityLog)
    private readonly repo: Repository<ActivityLog>,
    private readonly i18n: I18nService, // Add i18n service
  ) {}

  // Used when the actor comes from a TypeORM entity (e.g. after
  // usersService.findOne / findByEmail), where the role is nested as
  // `role.name`.
  toActorSnapshot(user: UserLike): ActorSnapshot {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: assertValidRole(user.role?.name, user.id),
      departmentId: user.departmentId ?? null,
    };
  }

  // Used when the actor comes from req.user (the JWT payload attached by
  // JwtStrategy), which uses `userId` and a plain-string `roleName` rather
  // than `id`/`role`.
  fromAuthUser(authUser: AuthUser): ActorSnapshot {
    return {
      id: authUser.userId,
      name: authUser.name,
      email: authUser.email,
      role: assertValidRole(authUser.roleName, authUser.userId),
      departmentId: authUser.departmentId ?? null,
    };
  }

  async log(input: LogActivityInput): Promise<void> {
    try {
      const entry = this.repo.create({
        actorId: input.actor?.id ?? null,
        actorName: input.actor?.name ?? 'System',
        actorEmail: input.actor?.email ?? '',
        actorRole: input.actor?.role ?? RoleName.EMPLOYEE,
        actorDepartmentId: input.actor?.departmentId ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId != null ? String(input.targetId) : null,
        description: input.description ?? null,
        metadata: input.metadata ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      });
      await this.repo.save(entry);
    } catch (err) {
      this.logger.error(`Failed to write activity log for action ${input.action}`, err as Error);
    }
  }

  async findForRequester(requester: RequestUser, query: QueryActivityLogDto): Promise<PaginatedResult<ActivityLog>> {
    if (requester.role === RoleName.ADMIN) {
      return this.paginate(this.baseQuery(query), query);
    }

    if (requester.role === RoleName.MANAGER) {
      if (requester.departmentId == null) {
        return { 
          data: [], 
          total: 0, 
          page: query.page ? Number(query.page) : 1, 
          limit: query.limit ? Number(query.limit) : 25, 
          totalPages: 0 
        };
      }

      const qb = this.baseQuery(query)
        .andWhere('log.actorDepartmentId = :deptId', { deptId: requester.departmentId })
        .andWhere('log.actorRole = :employeeRole', { employeeRole: RoleName.EMPLOYEE });

      if (query.userId !== undefined) {
        const belongsToScope = await this.repo.exists({
          where: {
            actorId: query.userId,
            actorDepartmentId: requester.departmentId,
            actorRole: RoleName.EMPLOYEE,
          },
        });
        if (!belongsToScope) {
          // Translate this error message
          throw new ForbiddenException(await this.i18n.translate('validation.ACTIVITY_LOG_PERMISSION_DENIED'));
        }
      }

      return this.paginate(qb, query);
    }

    throw new ForbiddenException(await this.i18n.translate('validation.PERMISSION_DENIED'));
  }

  private baseQuery(query: QueryActivityLogDto) {
    const qb = this.repo.createQueryBuilder('log').orderBy('log.createdAt', 'DESC');

    if (query.action) {
      qb.andWhere('log.action = :action', { action: query.action });
    }
    if (query.userId !== undefined) {
      qb.andWhere('log.actorId = :userId', { userId: query.userId });
    }
    if (query.dateFrom) {
      qb.andWhere('log.createdAt >= :dateFrom', { dateFrom: query.dateFrom });
    }
    if (query.dateTo) {
      qb.andWhere(
        new Brackets((b) => {
          b.where('log.createdAt <= :dateTo', { dateTo: query.dateTo });
        }),
      );
    }
    return qb;
  }

  private async paginate(
    qb: ReturnType<Repository<ActivityLog>['createQueryBuilder']>,
    query: QueryActivityLogDto,
  ): Promise<PaginatedResult<ActivityLog>> {
    // Parse page and limit from query params
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 25;

    // Calculate skip amount
    const skipAmount = (page - 1) * limit;

    const [data, total] = await qb
      .skip(skipAmount)
      .take(limit)
      .getManyAndCount();

    // Calculate total pages - FIXED: Don't force minimum of 1
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

    return { 
      data, 
      total, 
      page, 
      limit, 
      totalPages 
    };
  }
}