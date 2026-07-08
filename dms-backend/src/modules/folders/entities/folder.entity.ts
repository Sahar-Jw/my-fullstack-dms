import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Department } from '../../departments/entities/department.entity';
import { User } from '../../users/entities/user.entity';
import { Document } from '../../documents/entities/document.entity';

@Entity('folders')
export class Folder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'parent_folder_id', nullable: true })
  parentFolderId: number;

  @ManyToOne(() => Folder, (folder) => folder.children, { nullable: true })
  @JoinColumn({ name: 'parent_folder_id' })
  parentFolder: Folder;

  @OneToMany(() => Folder, (folder) => folder.parentFolder)
  children: Folder[];

  @Column({ name: 'department_id' })
  departmentId: number;

  @ManyToOne(() => Department, (department) => department.folders, {
    eager: true,
  })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ name: 'created_by' })
  createdById: number;

  @ManyToOne(() => User, (user) => user.folders)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ length: 150 })
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Document, (document) => document.folder)
  documents: Document[];
}
