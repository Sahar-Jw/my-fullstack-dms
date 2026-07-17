import { Column, Entity, Index, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { ActivityAction } from '../activity-action.enum';
import { RoleName } from '../../../common/enums/role.enum';

// Actor identity fields are denormalized (snapshotted at write time) rather
// than joined via FK. This means logs stay accurate and queryable even if
// the user is later deleted, renamed, or moved to a different department —
// which matters a lot for an audit trail.
@Entity('activity_logs')
@Index(['actorDepartmentId', 'createdAt'])
@Index(['actorId', 'createdAt'])
@Index(['action', 'createdAt'])
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', nullable: true })
  actorId: number | null; // nullable: system-initiated actions have no actor

  @Column({ type: 'varchar', length: 255 })
  actorName: string;

  @Column({ type: 'varchar', length: 255 })
  actorEmail: string;

  @Column({ type: 'enum', enum: RoleName })
  actorRole: RoleName;

  @Column({ type: 'int', nullable: true })
  actorDepartmentId: number | null;

  @Column({ type: 'enum', enum: ActivityAction })
  action: ActivityAction;

  @Column({ type: 'varchar', length: 50, nullable: true })
  targetType: string | null; // e.g. 'document', 'folder', 'user'

  @Column({ type: 'varchar', length: 100, nullable: true })
  targetId: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}