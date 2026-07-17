import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ActivityAction } from '../activity-action.enum';

export class QueryActivityLogDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number = 25;

  @IsOptional() @IsEnum(ActivityAction)
  action?: ActivityAction;

  @IsOptional() @Type(() => Number) @IsInt()
  userId?: number; // filter to a single actor, within whatever scope the caller is allowed

  @IsOptional() @IsDateString()
  dateFrom?: string;

  @IsOptional() @IsDateString()
  dateTo?: string;
}