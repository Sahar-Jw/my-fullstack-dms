import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ActivityLogService } from '../activity-logs/activity-log.service';
import { ActivityAction } from '../activity-logs/activity-action.enum';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    private readonly activityLogService: ActivityLogService,
    private readonly i18n: I18nService, // Add i18n service
  ) {}

  findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(await this.i18n.translate('validation.CATEGORY_NOT_FOUND'));
    }
    return category;
  }

  async create(dto: CreateCategoryDto, actor: AuthUser): Promise<Category> {
    const category = this.categoriesRepository.create(dto);
    const savedCategory = await this.categoriesRepository.save(category);

    // Log with translation
    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(actor),
      action: ActivityAction.CATEGORY_CREATE,
      targetType: 'Category',
      targetId: savedCategory.id,
      description: await this.i18n.translate('validation.CATEGORY_CREATE_LOG', {
        args: { categoryName: savedCategory.name }
      }),
    });

    return savedCategory;
  }

  async update(id: number, dto: UpdateCategoryDto, actor: AuthUser): Promise<Category> {
    const category = await this.findOne(id);
    const oldName = category.name;

    Object.assign(category, dto);
    const updatedCategory = await this.categoriesRepository.save(category);

    // Log with translation
    let description = await this.i18n.translate('validation.CATEGORY_UPDATE_LOG', {
      args: { oldName }
    });
    
    if (dto.name) {
      description += ' ' + await this.i18n.translate('validation.CATEGORY_RENAMED_LOG', {
        args: { newName: dto.name }
      });
    }

    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(actor),
      action: ActivityAction.CATEGORY_UPDATE,
      targetType: 'Category',
      targetId: id,
      description,
    });

    return updatedCategory;
  }

  async remove(id: number, actor: AuthUser): Promise<void> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: {documents :true},
    });
    if (!category) {
      throw new NotFoundException(await this.i18n.translate('validation.CATEGORY_NOT_FOUND'));
    }
    if (category.documents && category.documents.length > 0) {
      throw new BadRequestException(
        await this.i18n.translate('validation.CATEGORY_HAS_DOCUMENTS'),
      );
    }

    const categoryName = category.name;
    await this.categoriesRepository.remove(category);

    // Log with translation
    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(actor),
      action: ActivityAction.CATEGORY_DELETE,
      targetType: 'Category',
      targetId: id,
      description: await this.i18n.translate('validation.CATEGORY_DELETE_LOG', {
        args: { categoryName }
      }),
    });
  }
}