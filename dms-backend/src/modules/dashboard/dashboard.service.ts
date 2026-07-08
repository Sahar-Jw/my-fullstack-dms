import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { DocumentsService } from '../documents/documents.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { RoleName } from '../../common/decorators/roles.decorator';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private documentsService: DocumentsService,
  ) {}

  async getDashboard(user: AuthUser) {
    if (user.roleName === RoleName.ADMIN) {
      const [totalUsers, totalDocuments, storageUsed] = await Promise.all([
        this.usersRepository.count(),
        this.documentsService.countAll(),
        this.documentsService.storageUsedTotal(),
      ]);
      return {
        role: RoleName.ADMIN,
        totalUsers,
        totalDocuments,
        storageUsedBytes: storageUsed,
      };
    }

    if (user.roleName === RoleName.MANAGER) {
      const departmentDocuments = await this.documentsService.countByDepartment(
        user.departmentId,
      );
      return {
        role: RoleName.MANAGER,
        departmentId: user.departmentId,
        departmentDocuments,
      };
    }

    // Employee
    const [myDocuments, recentDocuments, storageUsed] = await Promise.all([
      this.documentsService.countByOwner(user.userId),
      this.documentsService.recentByOwner(user.userId, 5),
      this.documentsService.storageUsedByOwner(user.userId),
    ]);
    return {
      role: RoleName.EMPLOYEE,
      myDocuments,
      recentDocuments,
      storageUsedBytes: storageUsed,
    };
  }
}
