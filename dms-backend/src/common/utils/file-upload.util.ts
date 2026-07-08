import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

const ALLOWED_MIME_TYPES = (
  process.env.ALLOWED_MIME_TYPES ||
  'application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
).split(',');

const MAX_FILE_SIZE =
  parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024;

export const multerOptions = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req: any, file: Express.Multer.File, callback: Function) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          `File type ${file.mimetype} is not allowed. Allowed types: PDF, JPEG, PNG, Word documents.`,
        ),
        false,
      );
    }
    callback(null, true);
  },
};
