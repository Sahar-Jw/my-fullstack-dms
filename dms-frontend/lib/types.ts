export type RoleName = 'Admin' | 'Manager' | 'Employee';

export interface Role {
  id: number;
  name: RoleName;
  description?: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface AppUser {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  mustChangePassword: boolean;
  roleId: number;
  role: Role;
  departmentId: number | null;
  department: Department | null;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: number;
  name: string;
  parentFolderId: number | null;
  departmentId: number;
  department?: Department;
  createdById: number;
  createdAt: string;
}

export interface FolderTreeNode {
  id: number;
  name: string;
  departmentId: number;
  parentFolderId: number | null;
  children: FolderTreeNode[];
}

export interface DocVersion {
  id: number;
  documentId: number;
  versionNumber: number;
  filePath: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  uploadedBy: AppUser;
}

export interface DocAttachment {
  id: number;
  documentId: number;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  uploadedBy: AppUser;
}

export interface DmsDocument {
  id: number;
  name: string;
  description?: string;
  isDeleted: boolean;
  folderId: number;
  folder: Folder;
  categoryId: number;
  category: Category;
  ownerId: number;
  owner: AppUser;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  mustChangePassword: boolean;
  user: {
    id: number;
    name: string;
    email: string;
    role: RoleName;
    departmentId: number | null;
    department: string | null;
  };
}

export type AdminDashboard = {
  role: 'Admin';
  totalUsers: number;
  totalDocuments: number;
  storageUsedBytes: number;
};

export type ManagerDashboard = {
  role: 'Manager';
  departmentId: number;
  departmentDocuments: number;
};

export type EmployeeDashboard = {
  role: 'Employee';
  myDocuments: number;
  recentDocuments: DmsDocument[];
  storageUsedBytes: number;
};

export type DashboardData = AdminDashboard | ManagerDashboard | EmployeeDashboard;
