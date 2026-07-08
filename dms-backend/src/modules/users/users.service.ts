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
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as crypto from 'crypto'; 

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
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

  async create(dto: CreateUserDto): Promise<{ email: string; temporaryPassword: string }> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }
    const rawPassword = crypto.randomBytes(6).toString('hex') + '!A1'; 
    const hashedPassword = await bcrypt.hash(rawPassword, SALT_ROUNDS);
    const user = this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      roleId: dto.roleId,
      departmentId: dto.departmentId,
      isActive: true,
      // Admin creates the account; user must change the temporary password on first login
      mustChangePassword: true,
    });
    await this.usersRepository.save(user);

    return {
      email: user.email,
      temporaryPassword: rawPassword,
    };
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (dto.email && dto.email !== user.email) {
      const existing = await this.findByEmail(dto.email);
      if (existing) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    Object.assign(user, dto);
    return this.usersRepository.save(user);
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

  async forcePasswordChangeRequired(id: number): Promise<User> {
    const user = await this.findOne(id);
    user.mustChangePassword = true;
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
