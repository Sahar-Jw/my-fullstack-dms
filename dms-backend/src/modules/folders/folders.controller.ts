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
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { Roles, RoleName } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';

@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.foldersService.findAll(user);
  }

  @Get('tree')
  getTree(@CurrentUser() user: AuthUser) {
    return this.foldersService.getTree(user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.foldersService.findOne(id, user);
  }

  @Post()
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  create(@Body() dto: CreateFolderDto, @CurrentUser() user: AuthUser) {
    return this.foldersService.create(dto, user);
  }

  @Put(':id')
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFolderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.foldersService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.foldersService.remove(id, user);
  }
}
