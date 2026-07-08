import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateFolderDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsInt()
  parentFolderId?: number;

  // Required for Admin (choosing which department the folder belongs to).
  // Ignored for Manager/Employee - their own department is used automatically.
  @IsOptional()
  @IsInt()
  departmentId?: number;
}
