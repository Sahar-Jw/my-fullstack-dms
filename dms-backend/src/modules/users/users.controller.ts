import {
  Controller,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { Roles, RoleName } from '../../common/decorators/roles.decorator';

// 1. استيراد الديكوريتور والإنترفيس الخاص بالمستخدم الحالي المتوفرين في مشروعك
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';

@Controller('users')
@Roles(RoleName.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // NOTE: this must be declared before @Get(':id') -- Nest matches routes
  // in declaration order, and 'search' would otherwise be swallowed by the
  // ':id' param route.
  @Get('search')
  search(@Query() dto: SearchUserDto) {
    return this.usersService.search(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() dto: UpdateUserDto,
    @CurrentUser() admin: AuthUser, // 2. استخراج بيانات الأدمن الحالي الذي ينفذ الطلب
  ) {
    return this.usersService.update(id, dto, admin); // 3. تمرير الأدمن كمعامل ثالث للخدمة
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: AuthUser, // 2. استخراج بيانات الأدمن هنا أيضاً
  ) {
    return this.usersService.remove(id, admin); // 3. تمرير الأدمن للخدمة
  }

  @Patch(':id/toggle-status')
  toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: AuthUser, // 2. استخراج بيانات الأدمن هنا أيضاً
  ) {
    return this.usersService.toggleStatus(id, admin); // 3. تمرير الأدمن للخدمة
  }
}
