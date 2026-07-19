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
import { Exclude } from 'class-transformer';
import { Role } from '../../roles/entities/role.entity';
import { Department } from '../../departments/entities/department.entity';
import { Folder } from '../../folders/entities/folder.entity';
import { Document } from '../../documents/entities/document.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'role_id' })
  roleId: number;

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'department_id', nullable: true })
  departmentId: number;

  @ManyToOne(() => Department, (department) => department.users, {
    eager: true,
    nullable: true,
  })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column({ type: 'bytea', nullable: true, name: 'profile_picture_data', select: false })
  profilePictureData: Buffer | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'profile_picture_mime' })
  profilePictureMime: string | null;

  @Exclude()
  @Column({ length: 255 })
  password: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'must_change_password', default: true })
  mustChangePassword: boolean;

  @Column({ name: 'password_changed_at', type: 'timestamp', nullable: true })
  passwordChangedAt: Date;

  @Exclude()
  @Column({ name: 'reset_password_token_hash', type: 'varchar', length: 64, nullable: true })
  resetPasswordTokenHash: string | null;

  @Exclude()
  @Column({ name: 'reset_password_expires_at', type: 'timestamp', nullable: true })
  resetPasswordExpiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Folder, (folder) => folder.createdBy)
  folders: Folder[];

  @OneToMany(() => Document, (document) => document.owner)
  documents: Document[];
}