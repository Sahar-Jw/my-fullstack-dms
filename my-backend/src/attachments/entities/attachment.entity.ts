import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Document } from "../../documents/entities/document.entity";

@Entity({ name: 'attachments' })
export class Attachment {
    @PrimaryGeneratedColumn()
    id: number; 

    @Column()
    document_id: number;

    @Column()
    file_name: string;

    @Column()
    file_path: string;

    @Column()
    uploaded_by: number;

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    uploaded_at: Date;

    @ManyToOne(() => Document, (document) => document.attachments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'document_id' })
    document: Document;

    @ManyToOne(() => User, (user) => user.attachments)
    @JoinColumn({ name: 'uploaded_by' })
    uploader: User;
}
