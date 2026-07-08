import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import dataSource from '../../config/typeorm.config';
import { Role } from '../../modules/roles/entities/role.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Department } from '../../modules/departments/entities/department.entity';
import { RoleName } from '../../common/enums/role.enum';

dotenv.config();

/**
 * Seeds the three fixed roles (Admin/Manager/Employee), a default
 * "General Administration" department, and one Admin account so the system can be
 * accessed for the first time.
 */
async function seed() {
  await dataSource.initialize();

  const roleRepo = dataSource.getRepository(Role);
  const departmentRepo = dataSource.getRepository(Department);
  const userRepo = dataSource.getRepository(User);

  console.log('Seeding roles...');
  const roleNames = Object.values(RoleName);
  for (const name of roleNames) {
    const existing = await roleRepo.findOne({ where: { name } });
    if (!existing) {
      await roleRepo.save(roleRepo.create({ name }));
      console.log(`  created role: ${name}`);
    }
  }

  console.log('Seeding default department...');
  let defaultDepartment = await departmentRepo.findOne({
    where: { name: 'General Administration' },
  });
  if (!defaultDepartment) {
    defaultDepartment = await departmentRepo.save(
      departmentRepo.create({
        name: 'General Administration',
        description: 'Default department for the admin account',
      }),
    );
    console.log('  created department: General Administration');
  }

  console.log('Seeding default admin user...');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@dms.local';
  const existingAdmin = await userRepo.findOne({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const adminRole = await roleRepo.findOneOrFail({
      where: { name: RoleName.ADMIN },
    });
    const passwordHash = await bcrypt.hash(
      process.env.ADMIN_PASSWORD || 'Admin@12345',
      10,
    );

    await userRepo.save(
      userRepo.create({
        name: process.env.ADMIN_FULL_NAME || 'System Administrator',
        email: adminEmail,
        password: passwordHash,
        role: adminRole,
        roleId: adminRole.id,
        department: defaultDepartment,
        departmentId: defaultDepartment.id,
        isActive: true,
        mustChangePassword: false,
      }),
    );
    console.log(`  created admin user: ${adminEmail}`);
  } else {
    console.log(`  admin user already exists: ${adminEmail}`);
  }

  await dataSource.destroy();
  console.log('Seeding complete.');
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
