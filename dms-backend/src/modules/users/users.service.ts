import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { RolesService } from '../roles/roles.service';
import { DepartmentsService } from '../departments/departments.service';
import { RoleName } from '../../common/decorators/roles.decorator';

const SALT_ROUNDS = 10;
const DEFAULT_ROLE_NAME = RoleName.EMPLOYEE;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private rolesService: RolesService,
    private departmentsService: DepartmentsService,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User not found`);
    }
    return user;
  }

  findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } });
  }

  /**
   * Public self-registration. Role is never taken from the caller — every
   * self-registered user gets the fixed default role. Only an authenticated
   * admin can change roles afterward, via update().
   */
  async register(dto: {
    name: string;
    email: string;
    password: string;
    departmentId: number;
  }): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const defaultRole = await this.rolesService.findByName(DEFAULT_ROLE_NAME);
    if (!defaultRole) {
      // Table isn't seeded — fail loudly rather than let someone in with roleId null.
      throw new BadRequestException('Default role is not configured');
    }
    if (defaultRole.name !== RoleName.EMPLOYEE) {
      // Tripwire: guards against a future refactor accidentally handing out
      // Admin/Manager via self-registration by changing one constant.
      throw new Error('DEFAULT_ROLE_NAME must resolve to the Employee role');
    }

    const department = await this.departmentsService
      .findOne(dto.departmentId)
      .catch(() => null);
    if (!department) {
      throw new BadRequestException('Invalid department');
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      roleId: defaultRole.id,
      departmentId: dto.departmentId,
      isActive: true,
      mustChangePassword: false, // user set their own password, no reset needed
    });

    return this.usersRepository.save(user);
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (dto.email && dto.email !== user.email) {
      const existing = await this.findByEmail(dto.email);
      if (existing) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    const patch: Partial<User> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.email !== undefined) patch.email = dto.email;
    if (dto.roleId !== undefined) patch.roleId = dto.roleId;
    if (dto.departmentId !== undefined) patch.departmentId = dto.departmentId;

    await this.usersRepository.update(id, patch);

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async toggleStatus(id: number): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = !user.isActive;
    return this.usersRepository.save(user);
  }

  async updatePassword(id: number, newPassword: string): Promise<User> {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException(
        'Password must be at least 6 characters long',
      );
    }
    const user = await this.findOne(id);
    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.mustChangePassword = false;
    user.passwordChangedAt = new Date();
    return this.usersRepository.save(user);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }
}