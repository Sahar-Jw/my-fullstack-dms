import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty({ message: 'Department name is required and cannot be empty.' })
  @MinLength(2, { message: 'Department name must be at least 2 characters long.' })
  @MaxLength(100, { message: 'Department name cannot exceed 100 characters.' })
  name: string;

  @IsString()
  @IsOptional() // Optional because description is nullable: true in the entity
  @MaxLength(255, { message: 'Description cannot exceed 255 characters.' })
  description?: string;
}
