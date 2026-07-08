import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

const UPLOAD_ROOT = process.env.UPLOAD_ROOT || './uploads';
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10) || 20;

// NFR-02: يجب أن يدعم النظام رفع ملفات بحجم يصل إلى 20 ميجابايت دون تعطّل.
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function ensureDir(path: string) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

/**
 * Builds Multer options that store files on disk under
 * uploads/<subfolder>/<uuid><extension>.
 */
export function buildMulterOptions(subfolder: 'documents' | 'attachments') {
  const destination = join(UPLOAD_ROOT, subfolder);
  ensureDir(destination);

  return {
    storage: diskStorage({
      destination,
      filename: (_req, file, callback) => {
        const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
        callback(null, uniqueName);
      },
    }),
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: (
      _req: any,
      file: Express.Multer.File,
      callback: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      // UC-08 (3أ): إذا كان نوع الملف غير مسموح، يعرض النظام رسالة خطأ
      const allowedExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|txt|csv|zip)$/i;
      if (!allowedExtensions.test(file.originalname)) {
        return callback(
          new BadRequestException('نوع الملف غير مسموح به'),
          false,
        );
      }
      callback(null, true);
    },
  };
}

export function relativeStoredPath(
  subfolder: 'documents' | 'attachments',
  filename: string,
) {
  return join(subfolder, filename).replace(/\\/g, '/');
}
