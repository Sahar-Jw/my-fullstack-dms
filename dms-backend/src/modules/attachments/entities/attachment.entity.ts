import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Document } from '../../documents/entities/document.entity';
import { User } from '../../users/entities/user.entity';

/**
 * جدول Attachments: يخزّن الملفات المرفقة المرتبطة بكل وثيقة.
 */
@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Document, (document) => document.attachments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @Column({ name: 'document_id' })
  documentId: number;

  @Column({ type: 'varchar', length: 200, name: 'file_name' })
  fileName: string;

  @Column({ type: 'varchar', length: 255, name: 'file_path' })
  filePath: string;

  @ManyToOne(() => User, (user) => user.attachments, {
    eager: true,
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy: User;

  @Column({ name: 'uploaded_by' })
  uploadedById: number;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;
}
