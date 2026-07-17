import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(150)
  email: string;


  @IsInt()
  roleId: number;

  @IsOptional()
  @IsInt()
  departmentId?: number;
}
