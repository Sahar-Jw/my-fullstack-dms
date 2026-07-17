// lib/types.ts

export enum RoleName {
  Admin = 'Admin',
  Manager = 'Manager',
  Employee = 'Employee'
}

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
  profilePicture: string | null; // ✅ ADD THIS
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
  documentCount: number;
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
    profilePicture?: string | null; 
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

export type PreviewTarget = {
  previewPath: string;
  filename: string;
  mimeType: string;
};

export type PreviewLoadState = 'idle' | 'loading' | 'ready' | 'error';


export enum ActivityAction {
  LOGIN = 'LOGIN',
  LOGIN_FAILED ='LOGIN_FAILED',
  REGISTER = 'REGISTER',
  LOGOUT = 'LOGOUT',
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  DOCUMENT_DOWNLOAD = 'DOCUMENT_DOWNLOAD',
  DOCUMENT_UPDATE = 'DOCUMENT_UPDATE',
  DOCUMENT_DELETE = 'DOCUMENT_DELETE',
  DOCUMENT_RESTORE = 'DOCUMENT_RESTORE',
  DOCUMENT_MOVE = 'DOCUMENT_MOVE',
  FOLDER_CREATE = 'FOLDER_CREATE',
  FOLDER_DELETE = 'FOLDER_DELETE',
  USER_UPDATE = 'USER_UPDATE',
  USER_STATUS_TOGGLE = 'USER_STATUS_TOGGLE',
  SETTINGS_UPDATE = 'SETTINGS_UPDATE',
  ATTACHMENT_UPLOAD='ATTACHMENT_UPLOAD',
  ATTACHMENT_DOWNLOAD='ATTACHMENT_DOWNLOAD',
  ATTACHMENT_DELETE='ATTACHMENT_DELETE',
   DEPARTMENT_CREATE = 'DEPARTMENT_CREATE',
  DEPARTMENT_UPDATE = 'DEPARTMENT_UPDATE',
  DEPARTMENT_DELETE = 'DEPARTMENT_DELETE',
  
  CATEGORY_CREATE = 'CATEGORY_CREATE',
  CATEGORY_UPDATE = 'CATEGORY_UPDATE',
  CATEGORY_DELETE = 'CATEGORY_DELETE',
}

export interface ActivityLog {
  id: string;
  actorId: number | null;
  actorName: string;
  actorEmail: string;
  actorRole: RoleName;
  actorDepartmentId: number | null;
  action: ActivityAction;
  targetType: string | null;
  targetId: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}