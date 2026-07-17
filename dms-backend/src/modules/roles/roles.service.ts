import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    private readonly i18n: I18nService,
  ) {}

  findAll(): Promise<Role[]> {
    return this.rolesRepository.find();
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.rolesRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException(await this.i18n.translate('roles.ROLE_NOT_FOUND'));
    }
    return role;
  }

  findByName(name: string): Promise<Role> {
    return this.rolesRepository.findOne({ where: { name } });
  }
}