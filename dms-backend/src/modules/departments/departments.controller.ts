import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Roles, RoleName } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

// 🔥 استيراد الديكوريتور والإنترفيس الخاص بالمستخدم الحالي لالتقاط بيانات الأدمن
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}
  
  @Public()
  @Get()
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.findOne(id);
  }

  @Post()
  @Roles(RoleName.ADMIN)
  create(
    @Body() dto: CreateDepartmentDto,
    @CurrentUser() actor: AuthUser // 🔥 استخراج الأدمن الحالي
  ) {
    return this.departmentsService.create(dto, actor);
  }

  @Put(':id')
  @Roles(RoleName.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser() actor: AuthUser // 🔥 استخراج الأدمن الحالي
  ) {
    return this.departmentsService.update(id, dto, actor);
  }

  @Delete(':id')
  @Roles(RoleName.ADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthUser // 🔥 استخراج الأدمن الحالي
  ) {
    return this.departmentsService.remove(id, actor);
  }
}
