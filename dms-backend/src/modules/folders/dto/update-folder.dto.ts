import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateFolderDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  name: string;
}
