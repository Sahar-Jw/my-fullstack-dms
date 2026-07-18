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
import { Transform, Type } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';
import { DictionaryEntryDto } from './dictionary-entry.dto';

// Submitted as multipart/form-data alongside the optional `logo` and
// `favicon` files, so every field arrives as a string and numeric/array
// fields need explicit conversion — mirrors CreateDocumentDto's approach.
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

  // Capped at MAX_UPLOAD_CEILING_MB (see file-upload.util.ts) so this
  // dynamic limit can never exceed Multer's own hard ceiling.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  maxUploadSizeMb?: number;

  // Sent as a JSON-stringified array in the same multipart body so the
  // dictionary and the rest of the settings save "concurrently" in one submit.
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '' || Array.isArray(value)) return value;
    try {
      return JSON.parse(value);
    } catch {
      throw new BadRequestException('dictionary must be a valid JSON array');
    }
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DictionaryEntryDto)
  dictionary?: DictionaryEntryDto[];
}
