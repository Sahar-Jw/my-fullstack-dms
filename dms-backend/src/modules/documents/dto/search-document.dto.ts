import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchDocumentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  folderId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  ownerId?: number;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

   @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;
}
