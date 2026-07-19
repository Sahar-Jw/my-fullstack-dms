import {
  IsArray,
  IsHexColor,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { plainToInstance, Transform, Type } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';
import { DictionaryEntryDto } from './dictionary-entry.dto';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  siteName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaKeywords?: string;

  @IsOptional()
  @IsHexColor()
  themeColor?: string;

  @IsOptional()
  @IsHexColor()
  themeAccentInkColor?: string;

  @IsOptional()
  @IsHexColor()
  themeSecondaryColor?: string;

  @IsOptional()
  @IsHexColor()
  themeBackgroundColor?: string;

  @IsOptional()
  @IsHexColor()
  themeSurfaceColor?: string;

  @IsOptional()
  @IsHexColor()
  themeTextColor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  maxUploadSizeMb?: number;
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '' || Array.isArray(value)) return value;
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new BadRequestException('dictionary must be a valid JSON array');
    }
    if (!Array.isArray(parsed)) return parsed;
    return parsed.map((item) => plainToInstance(DictionaryEntryDto, item));
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DictionaryEntryDto)
  dictionary?: DictionaryEntryDto[];
}