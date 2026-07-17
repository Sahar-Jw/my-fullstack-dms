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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles, RoleName } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @Roles(RoleName.ADMIN)
  create(
    @Body() dto: CreateCategoryDto, 
    @CurrentUser() actor: AuthUser // 🔥 استخراج الأدمن الحالي
  ) {
    return this.categoriesService.create(dto, actor);
  }

  @Put(':id')
  @Roles(RoleName.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() actor: AuthUser // 🔥 استخراج الأدمن الحالي
  ) {
    return this.categoriesService.update(id, dto, actor);
  }

  @Delete(':id')
  @Roles(RoleName.ADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthUser // 🔥 استخراج الأدمن الحالي
  ) {
    return this.categoriesService.remove(id, actor);
  }
}
