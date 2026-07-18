import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

// Singleton table: exactly one row, always id = 1.
// Kept simple on purpose (no history/versioning) since the feature is a
// single global configuration object managed by the Admin.
@Entity('settings')
export class Setting {
  @PrimaryColumn({ default: 1 })
  id: number;

  @Column({ name: 'site_name', length: 100, default: 'Ledger' })
  siteName: string;

  @Column({ name: 'logo_path', length: 255, nullable: true })
  logoPath: string | null;

  @Column({ name: 'favicon_path', length: 255, nullable: true })
  faviconPath: string | null;

  @Column({ name: 'meta_title', length: 200, default: 'Ledger — Document Management' })
  metaTitle: string;

  @Column({ name: 'meta_description', length: 500, default: 'Document management system' })
  metaDescription: string;

  @Column({ name: 'meta_keywords', length: 500, default: '' })
  metaKeywords: string;

  // Hex color, e.g. #2f5d50 — mapped onto the --color-accent CSS variable.
  @Column({ name: 'theme_color', length: 7, default: '#2f5d50' })
  themeColor: string;

  @Column({ name: 'max_upload_size_mb', type: 'int', default: 10 })
  maxUploadSizeMb: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
