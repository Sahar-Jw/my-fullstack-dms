import { IsBooleanString, IsDateString, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  departmentId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  roleId?: number;

  // Sent as the string 'true' / 'false' over query params.
  @IsOptional()
  @IsBooleanString()
  isActive?: string;

  @IsOptional()
  @IsDateString()
  joinedFrom?: string;

  @IsOptional()
  @IsDateString()
  joinedTo?: string;
}
