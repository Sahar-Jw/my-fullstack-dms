
import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SkipPasswordCheck } from '../../common/decorators/skip-password-check.decorator';
import { multerOptions } from '../../common/utils/file-upload.util';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(@CurrentUser('userId') userId: number) {
    return this.profileService.getProfile(userId);
  }

  @Put()
  updateProfile(
    @CurrentUser('userId') userId: number,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(userId, dto);
  }

  @Patch('change-password')
  @SkipPasswordCheck()
  changePassword(
    @CurrentUser('userId') userId: number,
    @Body() dto: ChangePasswordDto,
  ) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    return this.profileService.changePassword(userId, dto);
  }

  @Patch('upload-picture')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  uploadProfilePicture(
    @CurrentUser('userId') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.profileService.uploadProfilePicture(userId, file);
  }

  @Patch('remove-picture')
  removeProfilePicture(@CurrentUser('userId') userId: number) {
    return this.profileService.removeProfilePicture(userId);
  }
}