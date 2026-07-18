import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class DictionaryEntryDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  key: string;

  @IsOptional()
  @IsString()
  en?: string;

  @IsOptional()
  @IsString()
  ar?: string;
}
