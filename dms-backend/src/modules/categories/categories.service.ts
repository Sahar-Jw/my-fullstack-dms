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

// 🔥 استيراد موديول سجلات الأنشطة والـ Enum الجديد
import { ActivityLogService } from '../activity-logs/activity-log.service';
import { ActivityAction } from '../activity-logs/activity-action.enum';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,

    // 🔥 حقن خدمة الأنشطة هنا داخل الباني
    private readonly activityLogService: ActivityLogService,
  ) {}

  findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Category not found`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto, actor: AuthUser): Promise<Category> {
    const category = this.categoriesRepository.create(dto);
    const savedCategory = await this.categoriesRepository.save(category);

    // 🔥 تسجيل حركة إنشاء تصنيف جديد باستخدام الـ Enum المخصص
    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(actor),
      action: ActivityAction.CATEGORY_CREATE,
      targetType: 'Category',
      targetId: savedCategory.id,
      description: `Created new document category: "${savedCategory.name}"`,
    });

    return savedCategory;
  }

  async update(id: number, dto: UpdateCategoryDto, actor: AuthUser): Promise<Category> {
    const category = await this.findOne(id);
    const oldName = category.name;

    Object.assign(category, dto);
    const updatedCategory = await this.categoriesRepository.save(category);

    // 🔥 تسجيل حركة تعديل التصنيف باستخدام الـ Enum المخصص
    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(actor),
      action: ActivityAction.CATEGORY_UPDATE,
      targetType: 'Category',
      targetId: id,
      description: `Updated category "${oldName}"` + (dto.name ? ` (Renamed to: "${dto.name}")` : ''),
    });

    return updatedCategory;
  }

  async remove(id: number, actor: AuthUser): Promise<void> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['documents'],
    });
    if (!category) {
      throw new NotFoundException(`Category not found`);
    }
    if (category.documents && category.documents.length > 0) {
      throw new BadRequestException(
        'Cannot delete a category that has documents assigned to it',
      );
    }

    const categoryName = category.name;
    await this.categoriesRepository.remove(category);

    // 🔥 تسجيل حركة حذف التصنيف باستخدام الـ Enum المخصص
    await this.activityLogService.log({
      actor: this.activityLogService.fromAuthUser(actor),
      action: ActivityAction.CATEGORY_DELETE,
      targetType: 'Category',
      targetId: id,
      description: `Deleted document category "${categoryName}"`,
    });
  }
}
