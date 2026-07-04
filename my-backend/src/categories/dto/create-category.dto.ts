import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Category name is required and cannot be empty.' })
  @MinLength(3, { message: 'Category name must be at least 3 characters long.' })
  @MaxLength(50, { message: 'Category name cannot exceed 50 characters.' })
  name: string;

  @IsString()
  @IsOptional() // Optional because description is nullable: true in the entity
  @MaxLength(255, { message: 'Description cannot exceed 255 characters.' })
  description?: string;
}
