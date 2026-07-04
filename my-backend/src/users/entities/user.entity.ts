import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  ManyToOne, 
  OneToMany, 
  JoinColumn 
} from 'typeorm';
import { Department } from '../../departments/entities/department.entity';
import { Document } from '../../documents/entities/document.entity';
import { Attachment } from '../../attachments/entities/attachment.entity';
import { UserRole } from '../../../utils/enum';


@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  full_name: string;

  @Column({ unique: true }) 
  email: string;

  @Column()
  password_hash: string;

  @Column({default: true})
  must_change_password: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.EMPLOYEE,
  })
  role: UserRole;

  @Column()
  department_id: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;


  @ManyToOne(() => Department, (department) => department.users)
  @JoinColumn({ name: 'department_id' })
  department!: Department;

  @OneToMany(() => Document, (document) => document.creator)
  created_documents!: Document[];

  @OneToMany(() => Attachment, (attachment) => attachment.uploader)
  attachments!: Attachment[];
}
