import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { extname } from 'path';

@Injectable()
export class SettingsFileStorageService {
  private readonly root: string;

  constructor(private configService: ConfigService) {
    const configuredPath = this.configService.get('fileUpload.path') || './uploads';
    this.root = path.resolve(process.cwd(), configuredPath, 'settings');
    if (!fs.existsSync(this.root)) {
      fs.mkdirSync(this.root, { recursive: true });
    }
  }

  // Saves under a fixed name per asset type ("logo" / "favicon") so the
  // public URL never changes — the site instantly picks up the new file the
  // moment it's written, without touching every reference to the old path.
  saveAsset(type: 'logo' | 'favicon', file: Express.Multer.File): string {
    // Clear any previous file for this type first, in case the extension changed.
    this.deleteAsset(type);
    const ext = extname(file.originalname).toLowerCase() || '.png';
    const fileName = `${type}${ext}`;
    fs.writeFileSync(path.join(this.root, fileName), file.buffer);
    return path.join('settings', fileName);
  }

  private deleteAsset(type: 'logo' | 'favicon') {
    if (!fs.existsSync(this.root)) return;
    for (const existing of fs.readdirSync(this.root)) {
      if (existing.startsWith(`${type}.`)) {
        fs.unlinkSync(path.join(this.root, existing));
      }
    }
  }
}
