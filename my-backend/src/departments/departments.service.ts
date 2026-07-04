import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Department } from './entities/department.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department) 
    private readonly departmentRepository: Repository<Department>
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    
    const existingDept = await this.departmentRepository.findOne({ 
      where: { name: createDepartmentDto.name } 
    });
    if (existingDept) {
      throw new ConflictException(`Department with name "${createDepartmentDto.name}" already exists.`);
    }

    const department = this.departmentRepository.create(createDepartmentDto);
    return await this.departmentRepository.save(department);
  }

  async findAll() {
    return await this.departmentRepository.find();
  }

  async findOne(id: number) {
    const department = await this.departmentRepository.findOne({ where: { id } });
    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found.`);
    }
    return department;
  }

  async update(id: number, updateDepartmentDto: UpdateDepartmentDto) {

    await this.findOne(id); 

    if (updateDepartmentDto.name) {
      const existingDept = await this.departmentRepository.findOne({ 
        where: { name: updateDepartmentDto.name } 
      });
      if (existingDept && existingDept.id !== id) {
        throw new ConflictException(`Another department already uses the name "${updateDepartmentDto.name}".`);
      }
    }

    await this.departmentRepository.update(id, updateDepartmentDto);
    return this.findOne(id);
  }

  async remove(id: number) {

    const department = await this.departmentRepository.findOne({ 
      where: { id }, 
      relations: { users: true, documents: true } 
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found.`);
    }

    if (department.users?.length > 0 || department.documents?.length > 0) {
      throw new BadRequestException(
        `Cannot delete department. It contains active users or documents. Relocate them first.`
      );
    }

    await this.departmentRepository.delete(id);
    return { success: true, message: 'Department deleted successfully.' };
  }
}
