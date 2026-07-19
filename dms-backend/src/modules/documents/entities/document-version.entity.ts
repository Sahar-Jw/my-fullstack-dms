import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Document } from './document.entity';
import { User } from '../../users/entities/user.entity';

@Entity('document_versions')
export class DocumentVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'document_id' })
  documentId: number;

  @ManyToOne(() => Document, (document) => document.versions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @Column({ name: 'uploaded_by' })
  uploadedById: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy: User;

  @Column({ name: 'version_number' })
  versionNumber: number;

  // The actual file bytes, stored directly in Postgres.
  // select: false keeps this out of normal find()/findOne() queries (list
  // views, "get document" calls, etc.) so we don't drag a multi-MB blob
  // along every time. We explicitly .addSelect('v.fileData') only in the
  // service methods that actually need to serve/copy the bytes.
  @Column({ type: 'bytea', nullable: true, select: false })
  fileData: Buffer;

  @Column({ name: 'original_file_name', length: 255, nullable: true })
  originalFileName: string;

  @Column({ name: 'mime_type', length: 100, nullable: true })
  mimeType: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
