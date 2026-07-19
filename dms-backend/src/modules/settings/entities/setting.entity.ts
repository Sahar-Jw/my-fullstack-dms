import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class Setting {
  @PrimaryColumn({ default: 1 })
  id: number;

  @Column({ name: 'site_name', length: 100, default: 'Ledger' })
  siteName: string;

  // Logo bytes, stored directly in Postgres (same pattern as
  // User.profilePictureData / DocumentVersion.fileData).
  @Column({ type: 'bytea', nullable: true, name: 'logo_data', select: false })
  logoData: Buffer | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'logo_mime' })
  logoMime: string | null;

  @Column({ type: 'bytea', nullable: true, name: 'favicon_data', select: false })
  faviconData: Buffer | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'favicon_mime' })
  faviconMime: string | null;

  @Column({ name: 'meta_title', length: 200, default: 'Ledger — Document Management' })
  metaTitle: string;

  @Column({ name: 'meta_description', length: 500, default: 'Document management system' })
  metaDescription: string;

  @Column({ name: 'meta_keywords', length: 500, default: '' })
  metaKeywords: string;

  @Column({ name: 'theme_color', length: 7, default: '#2f5d50' })
  themeColor: string;

  @Column({ name: 'max_upload_size_mb', type: 'int', default: 10 })
  maxUploadSizeMb: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}