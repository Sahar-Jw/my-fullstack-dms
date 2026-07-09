import { api } from './api';
import {
  AppUser,
  Category,
  DashboardData,
  DmsDocument,
  DocAttachment,
  DocVersion,
  Department,
  Folder,
  FolderTreeNode,
  LoginResponse,
  Role,
} from './types';

// ---------- Auth ----------
export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch('/auth/change-password', { currentPassword, newPassword }),
  forceChangePassword: (newPassword: string) =>
    api.patch('/auth/force-change-password', { newPassword }),
  requestReset: (email: string) =>
    api.post<{ message: string; resetToken?: string }>('/auth/reset-password', { email }),
  completeReset: (token: string, newPassword: string) =>
    api.post('/auth/reset-password/complete', { token, newPassword }),
  checkPasswordRequired: () =>
    api.get<{ mustChangePassword: boolean }>('/auth/check-password-required'),
};

// ---------- Users ----------
export const usersApi = {
  list: () => api.get<AppUser[]>('/users'),
  get: (id: number) => api.get<AppUser>(`/users/${id}`),
  create: (data: {
    name: string;
    email: string;
    roleId: number;
    departmentId?: number;
  }) => api.post<AppUser & Record<string, unknown>>('/users', data),
  update: (
    id: number,
    data: Partial<{
      name: string;
      email: string;
      roleId: number;
      departmentId: number | null;
      isActive: boolean;
    }>,
  ) => api.put<AppUser>(`/users/${id}`, data),
  remove: (id: number) => api.delete(`/users/${id}`),
  toggleStatus: (id: number) => api.patch<AppUser>(`/users/${id}/toggle-status`),
  forceResetRequired: (id: number) =>
    api.patch<AppUser>(`/users/${id}/reset-password-required`),
};

// ---------- Roles ----------
export const rolesApi = {
  list: () => api.get<Role[]>('/roles'),
};

// ---------- Departments ----------
export const departmentsApi = {
  list: () => api.get<Department[]>('/departments'),
  create: (data: { name: string; description?: string }) =>
    api.post<Department>('/departments', data),
  update: (id: number, data: { name?: string; description?: string }) =>
    api.put<Department>(`/departments/${id}`, data),
  remove: (id: number) => api.delete(`/departments/${id}`),
};

// ---------- Categories ----------
export const categoriesApi = {
  list: () => api.get<Category[]>('/categories'),
  create: (data: { name: string; description?: string }) =>
    api.post<Category>('/categories', data),
  update: (id: number, data: { name?: string; description?: string }) =>
    api.put<Category>(`/categories/${id}`, data),
  remove: (id: number) => api.delete(`/categories/${id}`),
};

// ---------- Folders ----------
export const foldersApi = {
  list: () => api.get<Folder[]>('/folders'),
  tree: () => api.get<FolderTreeNode[]>('/folders/tree'),
  get: (id: number) => api.get<Folder>(`/folders/${id}`),
  create: (data: { name: string; parentFolderId?: number; departmentId?: number }) =>
    api.post<Folder>('/folders', data),
  update: (id: number, data: { name: string }) => api.put<Folder>(`/folders/${id}`, data),
  remove: (id: number) => api.delete(`/folders/${id}`),
};

// ---------- Documents ----------
export interface DocumentSearchParams {
  name?: string;
  categoryId?: number;
  folderId?: number;
  ownerId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export const documentsApi = {
  list: () => api.get<DmsDocument[]>('/documents'),
  trash: () => api.get<DmsDocument[]>('/documents/trash'),
  search: (params: DocumentSearchParams) =>
    api.get<DmsDocument[]>('/documents/search', params as Record<string, any>),
  get: (id: number) => api.get<DmsDocument>(`/documents/${id}`),

  upload: (data: {
    file: File;
    name: string;
    description?: string;
    folderId: number;
    categoryId: number;
  }) => {
    const fd = new FormData();
    fd.append('file', data.file);
    fd.append('name', data.name);
    if (data.description) fd.append('description', data.description);
    fd.append('folderId', String(data.folderId));
    fd.append('categoryId', String(data.categoryId));
    return api.postForm<DmsDocument>('/documents', fd);
  },

  updateMetadata: (
    id: number,
    data: Partial<{ name: string; description: string; categoryId: number }>,
  ) => api.put<DmsDocument>(`/documents/${id}`, data),

  updateFile: (id: number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.putForm<DmsDocument>(`/documents/${id}/update-file`, fd);
  },

  softDelete: (id: number) => api.delete<DmsDocument>(`/documents/${id}`),
  restore: (id: number) => api.patch<DmsDocument>(`/documents/${id}/restore`),
  permanentDelete: (id: number) => api.delete(`/documents/${id}/permanent`),
  move: (id: number, folderId: number) =>
    api.patch<DmsDocument>(`/documents/${id}/move`, { folderId }),

  download: (id: number, fallbackName?: string) =>
    api.download(`/documents/${id}/download`, fallbackName),
  preview: (id: number) => api.blobUrl(`/documents/${id}/download`),

  getVersions: (id: number) => api.get<DocVersion[]>(`/documents/${id}/versions`),
  downloadVersion: (id: number, versionId: number, fallbackName?: string) =>
    api.download(`/documents/${id}/version/${versionId}/download`, fallbackName),
  previewVersion: (id: number, versionId: number) =>
    api.blobUrl(`/documents/${id}/version/${versionId}/download`),
  restoreVersion: (id: number, versionId: number) =>
    api.patch<DmsDocument>(`/documents/${id}/restore-version/${versionId}`),

  getAttachments: (id: number) => api.get<DocAttachment[]>(`/documents/${id}/attachments`),
  addAttachment: (id: number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.postForm<DocAttachment>(`/documents/${id}/attachments`, fd);
  },
  downloadAttachment: (attachmentId: number, fallbackName?: string) =>
    api.download(`/documents/attachments/${attachmentId}/download`, fallbackName),
  previewAttachment: (attachmentId: number) =>
    api.blobUrl(`/documents/attachments/${attachmentId}/download`),
  deleteAttachment: (attachmentId: number) =>
    api.delete(`/documents/attachments/${attachmentId}`),
};

// ---------- Dashboard ----------
export const dashboardApi = {
  get: () => api.get<DashboardData>('/dashboard'),
};
