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
import { I18nService } from 'nestjs-i18n';

const SALT_ROUNDS = 10;

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly i18n: I18nService,
  ) {}

  async getProfile(userId: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['role', 'department'],
    });
    if (!user) {
      throw new NotFoundException(await this.i18n.translate('profile.USER_NOT_FOUND'));
    }
    return user;
  }

  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<User> {
    const user = await this.getProfile(userId);
    
    // Update name if provided
    if (dto.name !== undefined) {
      user.name = dto.name;
    }
    
    // Update email if provided
    if (dto.email !== undefined) {
      if (dto.email !== user.email) {
        const existingUser = await this.usersRepository.findOne({
          where: { email: dto.email },
        });
        if (existingUser && existingUser.id !== userId) {
          throw new BadRequestException(await this.i18n.translate('profile.EMAIL_ALREADY_IN_USE'));
        }
        user.email = dto.email;
      }
    }
    
    return this.usersRepository.save(user);
  }

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.getProfile(userId);
    
    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException(await this.i18n.translate('profile.CURRENT_PASSWORD_INCORRECT'));
    }
    
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(await this.i18n.translate('profile.PASSWORD_SAME_AS_CURRENT'));
    }
    
    const hashedPassword = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    user.mustChangePassword = false;
    
    await this.usersRepository.save(user);
    return { message: await this.i18n.translate('profile.PASSWORD_CHANGED_SUCCESS') };
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
    
    // Store only the filename
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