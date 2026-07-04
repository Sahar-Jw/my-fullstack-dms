import { IsString, IsNotEmpty, IsOptional, IsInt, IsDateString, MaxLength } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty({ message: 'Document title is required.' })
  @MaxLength(150, { message: 'Title cannot exceed 150 characters.' })
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters.' })
  description?: string;

  @IsInt({ message: 'Category ID must be a valid integer.' })
  @IsNotEmpty({ message: 'Category ID is required.' })
  category_id: number;

  @IsInt({ message: 'Department ID must be a valid integer.' })
  @IsNotEmpty({ message: 'Department ID is required.' })
  department_id: number;

  @IsInt({ message: 'Created by User ID must be a valid integer.' })
  @IsNotEmpty({ message: 'Created by User ID is required.' })
  created_by: number;

  @IsString()
  @IsNotEmpty({ message: 'Main file path is required.' })
  main_file_path: string; 

  @IsDateString({}, { message: 'Document date must be a valid ISO date string (YYYY-MM-DD).' })
  @IsNotEmpty({ message: 'Document date is required.' })
  document_date: string;
}
