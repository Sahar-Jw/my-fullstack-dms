import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { Role } from '../../modules/roles/entities/role.entity';
import { Department } from '../../modules/departments/entities/department.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { Folder } from '../../modules/folders/entities/folder.entity';
import { Document } from '../../modules/documents/entities/document.entity';
import { DocumentVersion } from '../../modules/documents/entities/document-version.entity';
import { DocumentAttachment } from '../../modules/documents/entities/document-attachment.entity';
import { RoleName } from '../../common/enums/role.enum';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'dms_db',
  synchronize: true,
  entities: [
    Role,
    Department,
    User,
    Category,
    Folder,
    Document,
    DocumentVersion,
    DocumentAttachment,
  ],
});

async function seed() {
  await AppDataSource.initialize();
  console.log('Database connected. Seeding full test data...');

  const roleRepo = AppDataSource.getRepository(Role);
  const departmentRepo = AppDataSource.getRepository(Department);
  const userRepo = AppDataSource.getRepository(User);
  const categoryRepo = AppDataSource.getRepository(Category);
  const folderRepo = AppDataSource.getRepository(Folder);
  const documentRepo = AppDataSource.getRepository(Document);
  const versionRepo = AppDataSource.getRepository(DocumentVersion);
  const attachmentRepo = AppDataSource.getRepository(DocumentAttachment);

  const roles = [
    { name: RoleName.ADMIN, description: 'System Administrator - full access' },
    { name: RoleName.MANAGER, description: 'Department Manager' },
    { name: RoleName.EMPLOYEE, description: 'Regular employee user' },
  ];

  for (const role of roles) {
    const existing = await roleRepo.findOne({ where: { name: role.name } });
    if (!existing) {
      await roleRepo.save(roleRepo.create(role));
      console.log(`Created role: ${role.name}`);
    }
  }

  const adminRole = await roleRepo.findOneOrFail({ where: { name: RoleName.ADMIN } });
  const managerRole = await roleRepo.findOneOrFail({ where: { name: RoleName.MANAGER } });
  const employeeRole = await roleRepo.findOneOrFail({ where: { name: RoleName.EMPLOYEE } });

  const departments = [
    { name: 'General Administration', description: 'Default department for the admin account' },
    { name: 'Information Technology', description: 'IT department' },
    { name: 'Human Resources', description: 'HR department' },
    { name: 'Finance', description: 'Finance department' },
  ];

  for (const department of departments) {
    const existing = await departmentRepo.findOne({ where: { name: department.name } });
    if (!existing) {
      await departmentRepo.save(departmentRepo.create(department));
      console.log(`Created department: ${department.name}`);
    }
  }

  const adminDept = await departmentRepo.findOneOrFail({ where: { name: 'General Administration' } });
  const itDept = await departmentRepo.findOneOrFail({ where: { name: 'Information Technology' } });
  const hrDept = await departmentRepo.findOneOrFail({ where: { name: 'Human Resources' } });
  const financeDept = await departmentRepo.findOneOrFail({ where: { name: 'Finance' } });

  const users = [
    {
      name: 'System Administrator',
      email: 'admin@dms.com',
      password: 'Admin@12345',
      role: adminRole,
      department: adminDept,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: 'IT Manager',
      email: 'it.manager@dms.com',
      password: 'Manager@123',
      role: managerRole,
      department: itDept,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: 'HR Employee',
      email: 'hr.employee@dms.com',
      password: 'Employee@123',
      role: employeeRole,
      department: hrDept,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: 'Finance Employee',
      email: 'finance.employee@dms.com',
      password: 'Employee@123',
      role: employeeRole,
      department: financeDept,
      isActive: true,
      mustChangePassword: false,
    },
  ];

  const savedUsers = {} as Record<string, User>;

  for (const userData of users) {
    const existing = await userRepo.findOne({ where: { email: userData.email } });
    if (!existing) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = userRepo.create({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        roleId: userData.role.id,
        department: userData.department,
        departmentId: userData.department.id,
        isActive: userData.isActive,
        mustChangePassword: userData.mustChangePassword,
      });
      await userRepo.save(user);
      savedUsers[userData.email] = user;
      console.log(`Created user: ${userData.email}`);
    } else {
      savedUsers[userData.email] = existing;
    }
  }

  const categories = [
    { name: 'Contracts', description: 'Legal contracts and agreements' },
    { name: 'HR Documents', description: 'Human resources documents' },
    { name: 'Financial Reports', description: 'Financial reports and statements' },
    { name: 'IT Policies', description: 'IT policies and technical documentation' },
    { name: 'Marketing Materials', description: 'Marketing and communication collateral' },
  ];

  for (const category of categories) {
    const existing = await categoryRepo.findOne({ where: { name: category.name } });
    if (!existing) {
      await categoryRepo.save(categoryRepo.create(category));
      console.log(`Created category: ${category.name}`);
    }
  }

  const savedCategories = {} as Record<string, Category>;
  for (const category of categories) {
    savedCategories[category.name] = await categoryRepo.findOneOrFail({ where: { name: category.name } });
  }

  const folders = [
    {
      name: 'IT Policies',
      department: itDept,
      createdBy: savedUsers['it.manager@dms.com'],
    },
    {
      name: 'HR Records',
      department: hrDept,
      createdBy: savedUsers['hr.employee@dms.com'],
    },
    {
      name: 'Finance Reports',
      department: financeDept,
      createdBy: savedUsers['finance.employee@dms.com'],
    },
    {
      name: 'General Documents',
      department: adminDept,
      createdBy: savedUsers['admin@dms.com'],
    },
  ];

  for (const folderData of folders) {
    const existing = await folderRepo.findOne({ where: { name: folderData.name } });
    if (!existing) {
      await folderRepo.save(folderRepo.create({
        name: folderData.name,
        department: folderData.department,
        departmentId: folderData.department.id,
        createdBy: folderData.createdBy,
        createdById: folderData.createdBy.id,
        parentFolderId: null,
      }));
      console.log(`Created folder: ${folderData.name}`);
    }
  }

  const savedFolders = {} as Record<string, Folder>;
  for (const folderData of folders) {
    savedFolders[folderData.name] = await folderRepo.findOneOrFail({ where: { name: folderData.name } });
  }

  const documents = [
    {
      name: 'IT Security Policy',
      description: 'Internal document for IT security procedures.',
      category: savedCategories['IT Policies'],
      folder: savedFolders['IT Policies'],
      owner: savedUsers['it.manager@dms.com'],
      isDeleted: false,
    },
    {
      name: 'Employee Handbook',
      description: 'HR onboarding handbook for new employees.',
      category: savedCategories['HR Documents'],
      folder: savedFolders['HR Records'],
      owner: savedUsers['hr.employee@dms.com'],
      isDeleted: false,
    },
    {
      name: 'Q2 Financial Report',
      description: 'Finance report for the second quarter.',
      category: savedCategories['Financial Reports'],
      folder: savedFolders['Finance Reports'],
      owner: savedUsers['finance.employee@dms.com'],
      isDeleted: false,
    },
    {
      name: 'Marketing Strategy',
      description: 'Marketing plan and campaign summary.',
      category: savedCategories['Marketing Materials'],
      folder: savedFolders['General Documents'],
      owner: savedUsers['admin@dms.com'],
      isDeleted: false,
    },
  ];

  for (const documentData of documents) {
    const existing = await documentRepo.findOne({ where: { name: documentData.name } });
    if (!existing) {
      await documentRepo.save(documentRepo.create({
        name: documentData.name,
        description: documentData.description,
        folder: documentData.folder,
        folderId: documentData.folder.id,
        category: documentData.category,
        categoryId: documentData.category.id,
        owner: documentData.owner,
        ownerId: documentData.owner.id,
        isDeleted: documentData.isDeleted,
      }));
      console.log(`Created document: ${documentData.name}`);
    }
  }

  const savedDocuments = {} as Record<string, Document>;
  for (const documentData of documents) {
    savedDocuments[documentData.name] = await documentRepo.findOneOrFail({ where: { name: documentData.name } });
  }

  // Seed data uses small placeholder text buffers stored directly as bytea
  // (real uploads go through DocumentsService.create/updateFile with the
  // actual file bytes -- this is just enough to make download/preview work
  // for seeded demo documents).
  const versions = [
    {
      document: savedDocuments['IT Security Policy'],
      uploadedBy: savedUsers['it.manager@dms.com'],
      versionNumber: 1,
      fileData: Buffer.from('Placeholder content for IT Security Policy v1.'),
      originalFileName: 'it-security-policy-v1.txt',
      mimeType: 'text/plain',
    },
    {
      document: savedDocuments['Employee Handbook'],
      uploadedBy: savedUsers['hr.employee@dms.com'],
      versionNumber: 1,
      fileData: Buffer.from('Placeholder content for Employee Handbook v1.'),
      originalFileName: 'employee-handbook-v1.txt',
      mimeType: 'text/plain',
    },
  ];

  for (const versionData of versions) {
    const existing = await versionRepo.findOne({
      where: {
        documentId: versionData.document.id,
        versionNumber: versionData.versionNumber,
      },
    });
    if (!existing) {
      await versionRepo.save(versionRepo.create({
        document: versionData.document,
        documentId: versionData.document.id,
        uploadedBy: versionData.uploadedBy,
        uploadedById: versionData.uploadedBy.id,
        versionNumber: versionData.versionNumber,
        fileData: versionData.fileData,
        originalFileName: versionData.originalFileName,
        mimeType: versionData.mimeType,
        fileSize: versionData.fileData.length,
      }));
      console.log(`Created document version for: ${versionData.document.name}`);
    }
  }

  const attachments = [
    {
      document: savedDocuments['IT Security Policy'],
      uploadedBy: savedUsers['it.manager@dms.com'],
      fileName: 'network-diagram.txt',
      fileData: Buffer.from('Placeholder content for network-diagram.'),
      mimeType: 'text/plain',
    },
    {
      document: savedDocuments['Employee Handbook'],
      uploadedBy: savedUsers['hr.employee@dms.com'],
      fileName: 'benefits-summary.txt',
      fileData: Buffer.from('Placeholder content for benefits-summary.'),
      mimeType: 'text/plain',
    },
  ];

  for (const attachmentData of attachments) {
    const existing = await attachmentRepo.findOne({
      where: {
        documentId: attachmentData.document.id,
        fileName: attachmentData.fileName,
      },
    });
    if (!existing) {
      await attachmentRepo.save(attachmentRepo.create({
        document: attachmentData.document,
        documentId: attachmentData.document.id,
        uploadedBy: attachmentData.uploadedBy,
        uploadedById: attachmentData.uploadedBy.id,
        fileName: attachmentData.fileName,
        fileData: attachmentData.fileData,
        mimeType: attachmentData.mimeType,
        fileSize: attachmentData.fileData.length,
      }));
      console.log(`Created attachment: ${attachmentData.fileName}`);
    }
  }

  console.log('Full seeding complete.');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});