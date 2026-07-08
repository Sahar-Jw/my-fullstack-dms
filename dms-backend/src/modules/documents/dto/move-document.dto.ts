import { IsInt } from 'class-validator';

export class MoveDocumentDto {
  @IsInt()
  folderId: number;
}
