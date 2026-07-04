import { IsString, IsNotEmpty, IsEmail, IsEnum, IsInt, IsOptional, IsBoolean, Min, MinLength } from 'class-validator';
import { UserRole } from '../../../utils/enum';


export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  full_name: string;

  @IsEmail() 
  @IsNotEmpty()
  email: string;

  @IsEnum(UserRole) 
  @IsOptional() 
  role?: UserRole;

  @IsInt()
  @IsNotEmpty()
  department_id: number;

  @IsBoolean()
  @IsOptional() 
  is_active?: boolean;
}
