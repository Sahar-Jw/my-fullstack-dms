import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileStorageService {
  private readonly root: string;

  constructor(private configService: ConfigService) {
    this.root = this.configService.get('fileUpload.path') || './uploads';
  }

  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Saves a buffer under uploads/<type>/<documentId>/<uuid>-<originalname>
   * Returns the relative path stored in the DB.
   */
  saveFile(
    type: 'documents' | 'attachments',
    documentId: number,
    originalName: string,
    buffer: Buffer,
  ): string {
    const dir = path.join(this.root, type, String(documentId));
    this.ensureDir(dir);
    const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileName = `${uuidv4()}-${safeName}`;
    const fullPath = path.join(dir, fileName);
    fs.writeFileSync(fullPath, buffer);
    return path.join(type, String(documentId), fileName);
  }

  getAbsolutePath(relativePath: string): string {
    return path.join(this.root, relativePath);
  }

  fileExists(relativePath: string): boolean {
    return fs.existsSync(this.getAbsolutePath(relativePath));
  }

  deleteFile(relativePath: string): void {
    const abs = this.getAbsolutePath(relativePath);
    if (fs.existsSync(abs)) {
      fs.unlinkSync(abs);
    }
  }
}
