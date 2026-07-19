import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { DocumentsService } from '../documents/documents.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { RoleName } from '../../common/decorators/roles.decorator';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private documentsService: DocumentsService,
    private readonly i18n: I18nService,
  ) {}

  async getDashboard(user: AuthUser) {
    if (user.roleName === RoleName.ADMIN) {
      const [uploadersCount, totalDocuments, storageUsed] = await Promise.all([
        this.documentsService.countUniqueUploaders(),
        this.documentsService.countAll(),
        this.documentsService.storageUsedTotal(),
      ]);
      return {
        role: RoleName.ADMIN,
        roleLabel: await this.i18n.translate('dashboard.ROLE_ADMIN'),
        uploadersCount,
        uploadersCountLabel: await this.i18n.translate('dashboard.UPLOADERS_COUNT'),
        totalDocuments,
        totalDocumentsLabel: await this.i18n.translate('dashboard.TOTAL_DOCUMENTS'),
        storageUsedBytes: storageUsed,
        storageUsedLabel: await this.i18n.translate('dashboard.STORAGE_USED'),
      };
    }

    if (user.roleName === RoleName.MANAGER) {
      const departmentUploaders = await this.documentsService.countUniqueUploadersByDepartment(
        user.departmentId,
      );
      return {
        role: RoleName.MANAGER,
        roleLabel: await this.i18n.translate('dashboard.ROLE_MANAGER'),
        departmentId: user.departmentId,
        departmentUploaders,
        departmentUploadersLabel: await this.i18n.translate('dashboard.DEPARTMENT_UPLOADERS'),
      };
    }

    const [myDocuments, recentDocuments, storageUsed] = await Promise.all([
      this.documentsService.countByOwner(user.userId),
      this.documentsService.recentByOwner(user.userId, 5),
      this.documentsService.storageUsedByOwner(user.userId),
    ]);
    return {
      role: RoleName.EMPLOYEE,
      roleLabel: await this.i18n.translate('dashboard.ROLE_EMPLOYEE'),
      myDocuments,
      myDocumentsLabel: await this.i18n.translate('dashboard.MY_DOCUMENTS'),
      recentDocuments,
      recentDocumentsLabel: await this.i18n.translate('dashboard.RECENT_DOCUMENTS'),
      storageUsedBytes: storageUsed,
      storageUsedLabel: await this.i18n.translate('dashboard.STORAGE_USED'),
    };
  }
}