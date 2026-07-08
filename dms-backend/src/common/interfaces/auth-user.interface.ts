export interface AuthUser {
  userId: number;
  email: string;
  name: string;
  roleId: number;
  roleName: string;
  departmentId: number | null;
  mustChangePassword: boolean;
}
