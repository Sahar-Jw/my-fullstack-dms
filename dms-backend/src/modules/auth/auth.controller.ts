import { Body, Controller, HttpCode, HttpStatus, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  RequestResetPasswordDto,
  CompleteResetPasswordDto,
} from './dto/reset-password.dto';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { SkipPasswordCheck } from '../../common/decorators/skip-password-check.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @SkipPasswordCheck()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout() {
    return this.authService.logout();
  }

  @UseGuards(JwtAuthGuard)
  @SkipPasswordCheck()
  @HttpCode(HttpStatus.OK)
  @Patch('change-password')
  changePassword(
    @CurrentUser('userId') userId: number,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  requestReset(@Body() dto: RequestResetPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password/complete')
  completeReset(@Body() dto: CompleteResetPasswordDto) {
    return this.authService.completePasswordReset(dto.token, dto.newPassword);
  }
}