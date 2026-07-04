import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Attachment } from "../../attachments/entities/attachment.entity";
import { Category } from "../../categories/entities/category.entity";
import { Department } from "../../departments/entities/department.entity";
import { User } from "../../users/entities/user.entity";

@Entity({ name: 'documents' })
export class Document {
    @PrimaryGeneratedColumn()
    id: number; 

    @Column()
    title: string; 

    @Column({ nullable: true })
    description: string;

    @Column()
    category_id: number;

    @Column()
    department_id: number;

    @Column()
    created_by: number;

    @Column()
    main_file_path: string;

    @Column({ type: 'date' })
    document_date: Date; 

    @CreateDateColumn({ type: 'timestamp' })
    upload_date: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;

    @OneToMany(() => Attachment, (attachment) => attachment.document)
    attachments: Attachment[]; 

    @ManyToOne(() => Category, (category) => category.documents)
    @JoinColumn({ name: 'category_id' })
    category: Category;

    @ManyToOne(() => Department, (department) => department.documents)
    @JoinColumn({ name: 'department_id' })
    department: Department; 

    @ManyToOne(() => User, (user) => user.created_documents)
    @JoinColumn({ name: 'created_by' })
    creator: User; 
}
