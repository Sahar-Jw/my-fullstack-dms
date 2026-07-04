import { IsString, IsNotEmpty, IsInt, MaxLength } from 'class-validator';

export class CreateAttachmentDto {
  @IsInt({ message: 'Document ID must be a valid integer.' })
  @IsNotEmpty({ message: 'Document ID is required to link this attachment.' })
  document_id: number;

  @IsString()
  @IsNotEmpty({ message: 'File name is required.' })
  @MaxLength(100, { message: 'File name cannot exceed 100 characters.' })
  file_name: string;

  @IsString()
  @IsNotEmpty({ message: 'File path is required.' })
  file_path: string;

  @IsInt({ message: 'Uploader User ID must be a valid integer.' })
  @IsNotEmpty({ message: 'The ID of the user uploading this file is required.' })
  uploaded_by: number;
}
