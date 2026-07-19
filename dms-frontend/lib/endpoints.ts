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
  ActivityAction,
  PaginatedResult,
  ActivityLog,
  Setting,
  DictionaryEntry,
} from './types';

// ---------- Auth ----------
export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),
  register: (data: { name: string; email: string; password: string; departmentId: number }) =>
    api.post<LoginResponse>('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch('/auth/change-password', { currentPassword, newPassword }),
  requestReset: (email: string) =>
    api.post<{ message: string }>('/auth/reset-password', { email }),
  completeReset: (token: string, newPassword: string) =>
    api.post('/auth/reset-password/complete', { token, newPassword }),
};

// ---------- Users ----------
export const usersApi = {
  list: () => api.get<AppUser[]>('/users'),
  get: (id: number) => api.get<AppUser>(`/users/${id}`),
  update: (
    id: number,
    data: {
      name?: string;
      email?: string;
      roleId?: number;
      departmentId?: number | null;
      isActive?: boolean;
    },
  ) => {
    const cleanData: Record<string, any> = {};
    if (data.name !== undefined) cleanData.name = data.name;
    if (data.email !== undefined) cleanData.email = data.email;
    if (data.roleId !== undefined) cleanData.roleId = data.roleId;
    if (data.departmentId !== undefined) cleanData.departmentId = data.departmentId;
    if (data.isActive !== undefined) cleanData.isActive = data.isActive;
    return api.put<AppUser>(`/users/${id}`, cleanData);
  },
  remove: (id: number) => api.delete(`/users/${id}`),
  toggleStatus: (id: number) => api.patch<AppUser>(`/users/${id}/toggle-status`),
};

// ---------- Profile ----------
export const profileApi = {
  // Get current user profile
  get: () => api.get<AppUser>('/profile'),
  
  // Update profile (name only)
  update: (data: { name?: string , email:string}) =>
    api.put<AppUser>('/profile', data),
  
  // Change password
  changePassword: (data: { 
    currentPassword: string; 
    newPassword: string; 
    confirmPassword: string 
  }) =>
    api.patch('/profile/change-password', data),
  
  // Upload profile picture
  uploadPicture: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.patchForm<AppUser>('/profile/upload-picture', fd);
  },
  
  // Remove profile picture
  removePicture: () => api.patch<AppUser>('/profile/remove-picture'),
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
  update: (id: number, data: { name: string }) =>
    api.put<Folder>(`/folders/${id}`, data),
  remove: (id: number) => api.delete(`/folders/${id}`),
};

// ---------- Documents ----------
export interface DocumentSearchParams {
  name?: string;
  categoryId?: number;
  folderId?: number;
  ownerId?: number;
  departmentId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export const documentsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResult<DmsDocument>>('/documents', params as Record<string, any>),
  trash: () => api.get<DmsDocument[]>('/documents/trash'),
  search: (params: DocumentSearchParams) =>
    api.get<DmsDocument[]>('/documents/search', params as Record<string, any>),
  get: (id: number) => api.get<DmsDocument>(`/documents/${id}`),

  upload: (data: {
    files: File[];
    name?: string;
    description?: string;
    folderId: number;
    categoryId: number;
  }) => {
    const fd = new FormData();
    data.files.forEach((f) => fd.append('files', f));
    if (data.name) fd.append('name', data.name);
    if (data.description) fd.append('description', data.description);
    fd.append('folderId', String(data.folderId));
    fd.append('categoryId', String(data.categoryId));
    return api.postForm<DmsDocument[]>('/documents', fd);
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

  addAttachment: (id: number, files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    return api.postForm<DocAttachment[]>(`/documents/${id}/attachments`, fd);
  },

  downloadAttachment: (attachmentId: number, fallbackName?: string) =>
    api.download(`/documents/attachments/${attachmentId}/download`, fallbackName),
  previewAttachment: (attachmentId: number) =>
    api.blobUrl(`/documents/attachments/${attachmentId}/download`),
  deleteAttachment: (attachmentId: number) =>
    api.delete(`/documents/attachments/${attachmentId}`),
};

// ---------- Settings ----------
export interface UpdateSettingsPayload {
  siteName?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  themeColor?: string;
  maxUploadSizeMb?: number;
  logo?: File | null;
  favicon?: File | null;
  dictionary?: { key: string; en: string; ar: string }[];
}

export const settingsApi = {
  get: () => api.get<Setting>('/settings'),
  getDictionary: () => api.get<DictionaryEntry[]>('/settings/dictionary'),
  update: (data: UpdateSettingsPayload) => {
    const fd = new FormData();
    if (data.siteName !== undefined) fd.append('siteName', data.siteName);
    if (data.metaTitle !== undefined) fd.append('metaTitle', data.metaTitle);
    if (data.metaDescription !== undefined) fd.append('metaDescription', data.metaDescription);
    if (data.metaKeywords !== undefined) fd.append('metaKeywords', data.metaKeywords);
    if (data.themeColor !== undefined) fd.append('themeColor', data.themeColor);
    if (data.maxUploadSizeMb !== undefined) fd.append('maxUploadSizeMb', String(data.maxUploadSizeMb));
    if (data.logo) fd.append('logo', data.logo);
    if (data.favicon) fd.append('favicon', data.favicon);
    if (data.dictionary) fd.append('dictionary', JSON.stringify(data.dictionary));
    return api.putForm<Setting>('/settings', fd);
  },
};

// ---------- Dashboard ----------
export const dashboardApi = {
  get: () => api.get<DashboardData>('/dashboard'),
};


// lib/endpoints.ts (addition)
export interface ActivityLogQueryParams {
  page?: number;
  limit?: number;
  action?: ActivityAction;
  userId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export const activityLogsApi = {
  list: (params: ActivityLogQueryParams = {}) =>
    api.get<PaginatedResult<ActivityLog>>('/activity-logs', params as Record<string, any>),
};