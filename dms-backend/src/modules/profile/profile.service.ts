
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { User } from '../users/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getProfile(userId: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['role', 'department'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<User> {
    const user = await this.getProfile(userId);
    
    if (dto.name !== undefined) {
      user.name = dto.name;
    }
    
    return this.usersRepository.save(user);
  }

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.getProfile(userId);
    
    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }
    
    const hashedPassword = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    user.mustChangePassword = false;
    
    await this.usersRepository.save(user);
    return { message: 'Password changed successfully' };
  }

  async uploadProfilePicture(userId: number, file: Express.Multer.File): Promise<User> {
    const user = await this.getProfile(userId);
    
    // Delete old picture if exists
    if (user.profilePicture) {
      const oldPath = path.join('./uploads/profile-pictures', user.profilePicture);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (err) {
          console.log('Error deleting old picture:', err);
        }
      }
    }
    
    // Create directory if it doesn't exist
    const uploadDir = './uploads/profile-pictures';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = path.join(uploadDir, filename);
    
    // Save file
    fs.writeFileSync(filePath, file.buffer);
    
    // ✅ STORE ONLY THE FILENAME (not the full path)
    user.profilePicture = filename;
    await this.usersRepository.save(user);
    
    return user;
  }

  async removeProfilePicture(userId: number): Promise<User> {
    const user = await this.getProfile(userId);
    
    if (user.profilePicture) {
      const oldPath = path.join('./uploads/profile-pictures', user.profilePicture);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (err) {
          console.log('Error deleting picture:', err);
        }
      }
      user.profilePicture = null;
      return this.usersRepository.save(user);
    }
    
    return user;
  }
}