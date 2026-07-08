/**
 * Seed script: creates roles, departments, the pre-seeded admin user, and
 * default categories. Run with: npm run seed
 *
 * All user-visible seed data is in English.
 */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { Role } from '../modules/roles/entities/role.entity';
import { Department } from '../modules/departments/entities/department.entity';
import { User } from '../modules/users/entities/user.entity';
import { Category } from '../modules/categories/entities/category.entity';
import { RoleName } from '../common/enums/role.enum';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10) || 5432,
  username: process.env.DB_USERNAME ,
  password: process.env.DB_PASSWORD ,
  database: process.env.DB_DATABASE ,
  synchronize: true,
  entities: [Role, Department, User, Category],
});

async function seed() {
  await AppDataSource.initialize();
  console.log('Database connected. Seeding...');

  const roleRepo = AppDataSource.getRepository(Role);
  const deptRepo = AppDataSource.getRepository(Department);
  const userRepo = AppDataSource.getRepository(User);
  const categoryRepo = AppDataSource.getRepository(Category);

  const roleNames = [
    { name: RoleName.ADMIN, description: 'System Administrator - full access' },
    { name: RoleName.MANAGER, description: 'Department Manager' },
    { name: RoleName.EMPLOYEE, description: 'Regular employee user' },
  ];
  for (const role of roleNames) {
    const existing = await roleRepo.findOne({ where: { name: role.name } });
    if (!existing) {
      await roleRepo.save(roleRepo.create(role));
      console.log(`Created role: ${role.name}`);
    }
  }
  const adminRole = await roleRepo.findOneOrFail({
    where: { name: RoleName.ADMIN },
  });

  const departmentNames = [
    { name: 'General Administration', description: 'Default department for the admin account' },
    { name: 'IT', description: 'Information Technology' },
    { name: 'HR', description: 'Human Resources' },
  ];
  for (const department of departmentNames) {
    const existing = await deptRepo.findOne({ where: { name: department.name } });
    if (!existing) {
      await deptRepo.save(deptRepo.create(department));
      console.log(`Created department: ${department.name}`);
    }
  }

  const existingAdmin = await userRepo.findOne({
    where: { email: 'admin@dms.com' },
  });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await userRepo.save(
      userRepo.create({
        name: 'System Administrator',
        email: 'admin@dms.com',
        password: hashedPassword,
        role: adminRole,
        roleId: adminRole.id,
        departmentId: null,
        isActive: true,
        mustChangePassword: false,
      }),
    );
    console.log('Created admin user: admin@dms.com / admin123');
  } else {
    console.log('Admin user already exists, skipping.');
  }

  const categoryNames = [
    { name: 'Contracts', description: 'Legal contracts and agreements' },
    { name: 'HR Documents', description: 'Human resources documents' },
    { name: 'Financial Reports', description: 'Financial reports and statements' },
  ];
  for (const category of categoryNames) {
    const existing = await categoryRepo.findOne({ where: { name: category.name } });
    if (!existing) {
      await categoryRepo.save(categoryRepo.create(category));
      console.log(`Created category: ${category.name}`);
    }
  }

  console.log('Seeding complete.');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
