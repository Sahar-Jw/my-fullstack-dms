// backend/src/common/utils/file-upload.util.ts

import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';
import { extname } from 'path';

export const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // Documents
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  // Excel files
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
  'text/csv', // .csv
  // Text
  'text/plain',
  'application/json',
];

export const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf',
  '.doc', '.docx',
  '.xls', '.xlsx', '.xlsm', '.csv',
  '.txt', '.json',
];

//  Profile picture specific options
export const profilePictureMulterOptions = {
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB for profile pictures
  },
  fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const ext = extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

    if (allowedImageTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException('Only JPEG, PNG, GIF, and WEBP images are allowed (max 2MB)'),
        false,
      );
    }
  },
  storage: memoryStorage(),
};


// Logo / favicon uploads for the global Settings feature. Favicons are
// commonly .ico (mimetype is inconsistent across browsers — sometimes
// image/x-icon, sometimes application/octet-stream) so the extension check
// carries more weight here than for regular document uploads.
export const settingsAssetMulterOptions = {
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB is plenty for a logo/favicon
  },
  fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif', '.ico'];
    const ext = extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(
          'Only PNG, JPG, SVG, WEBP, GIF, or ICO files are allowed (max 2MB)',
        ),
        false,
      );
    }
  },
  storage: memoryStorage(),
};

// Hard ceiling Multer enforces before any of our own code runs — a safety
// net against abuse, independent of the admin-configured limit below.
export const MAX_UPLOAD_CEILING_MB = 200;

export const multerOptions = {
  limits: {
    fileSize: MAX_UPLOAD_CEILING_MB * 1024 * 1024,
  },
  fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
    const isAllowedMimeType = ALLOWED_MIME_TYPES.includes(file.mimetype);
    const ext = extname(file.originalname).toLowerCase();
    const isAllowedExtension = ALLOWED_EXTENSIONS.includes(ext);

    if (isAllowedMimeType || isAllowedExtension) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(
          `File type not allowed. Allowed: PDF, JPEG, PNG, Word (.doc, .docx), Excel (.xls, .xlsx), CSV`,
        ),
        false,
      );
    }
  },
  storage: memoryStorage(),
};