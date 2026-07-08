import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Folder } from '../../folders/entities/folder.entity';
import { Category } from '../../categories/entities/category.entity';
import { User } from '../../users/entities/user.entity';
import { DocumentVersion } from './document-version.entity';
import { DocumentAttachment } from './document-attachment.entity';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'folder_id' })
  folderId: number;

  @ManyToOne(() => Folder, (folder) => folder.documents, { eager: true })
  @JoinColumn({ name: 'folder_id' })
  folder: Folder;

  @Column({ name: 'category_id' })
  categoryId: number;

  @ManyToOne(() => Category, (category) => category.documents, {
    eager: true,
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'owner_id' })
  ownerId: number;

  @ManyToOne(() => User, (user) => user.documents, { eager: true })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => DocumentVersion, (version) => version.document)
  versions: DocumentVersion[];

  @OneToMany(() => DocumentAttachment, (attachment) => attachment.document)
  attachments: DocumentAttachment[];
}
