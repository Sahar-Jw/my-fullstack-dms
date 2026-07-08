import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private departmentsRepository: Repository<Department>,
  ) {}

  findAll(): Promise<Department[]> {
    return this.departmentsRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<Department> {
    const department = await this.departmentsRepository.findOne({
      where: { id },
    });
    if (!department) {
      throw new NotFoundException(`Department not found`);
    }
    return department;
  }

  create(dto: CreateDepartmentDto): Promise<Department> {
    const department = this.departmentsRepository.create(dto);
    return this.departmentsRepository.save(department);
  }

  async update(id: number, dto: UpdateDepartmentDto): Promise<Department> {
    const department = await this.findOne(id);
    Object.assign(department, dto);
    return this.departmentsRepository.save(department);
  }

  async remove(id: number): Promise<void> {
    const department = await this.findOne(id);
    const usersCount = await this.departmentsRepository
      .createQueryBuilder('d')
      .leftJoin('d.users', 'u')
      .where('d.id = :id', { id })
      .andWhere('u.id IS NOT NULL')
      .getCount();
    if (usersCount > 0) {
      throw new BadRequestException(
        'Cannot delete a department that still has users assigned to it',
      );
    }
    await this.departmentsRepository.remove(department);
  }
}
