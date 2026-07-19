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
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SkipPasswordCheck } from '../../common/decorators/skip-password-check.decorator';
import { multerOptions } from '../../common/utils/file-upload.util';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { I18nService } from 'nestjs-i18n';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly i18n: I18nService,
  ) {}

  @Get()
  getProfile(@CurrentUser('userId') userId: number) {
    return this.profileService.getProfile(userId);
  }

  // Serves the picture bytes directly -- called by the frontend via
  // api.blobUrl('/profile/picture') so the Authorization header is sent.
  @Get('picture')
  async getPicture(@CurrentUser('userId') userId: number, @Res() res: Response) {
    const picture = await this.profileService.getProfilePictureBlob(userId);
    if (!picture) {
      throw new NotFoundException();
    }
    res.set('Content-Type', picture.mime);
    res.send(picture.data);
  }

  @Put()
  async updateProfile(
    @CurrentUser('userId') userId: number,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(userId, dto);
  }

  @Patch('change-password')
  @SkipPasswordCheck()
  async changePassword(
    @CurrentUser('userId') userId: number,
    @Body() dto: ChangePasswordDto,
  ) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException(await this.i18n.translate('profile.PASSWORDS_DO_NOT_MATCH'));
    }
    return this.profileService.changePassword(userId, dto);
  }

  @Patch('upload-picture')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadProfilePicture(
    @CurrentUser('userId') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException(await this.i18n.translate('profile.NO_FILE_UPLOADED'));
    }
    return this.profileService.uploadProfilePicture(userId, file);
  }

  @Patch('remove-picture')
  removeProfilePicture(@CurrentUser('userId') userId: number) {
    return this.profileService.removeProfilePicture(userId);
  }
}
