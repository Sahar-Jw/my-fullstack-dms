import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Role } from '../modules/roles/entities/role.entity';
import { User } from '../modules/users/entities/user.entity';
import { Department } from '../modules/departments/entities/department.entity';
import { Category } from '../modules/categories/entities/category.entity';
import { Document } from '../modules/documents/entities/document.entity';
import { Attachment } from '../modules/attachments/entities/attachment.entity';

dotenv.config();

/**
 * Standalone DataSource used by the TypeORM CLI (migration:generate / migration:run).
 * The running NestJS app configures TypeORM via TypeOrmModule.forRootAsync in app.module.ts.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'dms_db',
  entities: [Role, User, Department, Category, Document, Attachment],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
