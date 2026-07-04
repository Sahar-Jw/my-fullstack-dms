import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>, 
    private readonly jwtService: JwtService
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({ where: { email: createUserDto.email } });
    if (existingUser) {
      throw new ConflictException(`User with email ${createUserDto.email} already exists.`);
    }

    const temporaryPassword = crypto.randomBytes(8).toString('hex');

    const salt = await bcrypt.genSalt();
    const password_hash = await bcrypt.hash(temporaryPassword, salt);

    const newUser = this.userRepository.create({
      ...createUserDto,
      password_hash,
      must_change_password: true
    });
    await this.userRepository.save(newUser);

    return {
      message: 'user create successfully with temporary password',
      user: {
        id: newUser.id,
        full_name: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
      },
      temporaryPassword,
    };
  }

  async findAll() {
    return await this.userRepository.find();
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User not found.`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.findOne(id);
    await this.userRepository.update(id, updateUserDto);
    return await this.findOne(id);
  }

  async remove(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { created_documents: true, attachments: true }
    });

    if (!user) {
      throw new NotFoundException(`User not found.`);
    }

    if (user.created_documents?.length > 0 || user.attachments?.length > 0) {
      throw new BadRequestException(
        `Cannot remove user. This user has registered documents or attachments in the system. Deactivate them instead.`
      );
    }

    await this.userRepository.delete(id);
    return { message: `User ${user.full_name} has been removed.` };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({ where: { email: loginDto.email } });

    if (!user) {
      throw new UnauthorizedException(`invalid email or password`);
    }

    const isPasswordMatch = await bcrypt.compare(loginDto.password, user.password_hash);
    if (!isPasswordMatch) {
      throw new UnauthorizedException(`invalid email or password`);
    }

    if (user.must_change_password) {
      return {
        mustChangePassword: true,
        message: 'User must change password',
        userId: user.id
      };
    }

    const payload = {
      id: user.id,
      role: user.role,
    };
    
    return {
      access_token: await this.jwtService.signAsync(payload),
      mustChangePassword: false,
      message: 'Login successful',
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role }
    };
  }

  async changeTemporaryPassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User not found.`);
    }
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException('unmatched password');
    }

    const salt = await bcrypt.genSalt();
    user.password_hash = await bcrypt.hash(changePasswordDto.newPassword, salt);
    
    user.must_change_password = false; 

    await this.userRepository.save(user);

    return { 
      success: true,
      message: 'Password changed successfully.', 
    };
  }
}
