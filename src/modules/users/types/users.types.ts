import type { UserRole } from '../../../shared/constants/index.js';

export interface UserListQuery {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  departmentId?: string;
  isActive?: boolean;
}

export interface CreateUserInput {
  email: string;
  password: string;
  roleId: string;
  departmentId?: string | null;
  employeeTypeId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  employeeCode?: string | null;
  salary?: number | null;
  lastSalaryTransferDate?: string | null;
  officeLocationId?: string | null;
  workStartTime?: string | null;
  workEndTime?: string | null;
  projectLatitude?: number | null;
  projectLongitude?: number | null;
  projectRadiusMeters?: number | null;
  isActive?: boolean;
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
  roleId?: string;
  departmentId?: string | null;
  employeeTypeId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  employeeCode?: string | null;
  salary?: number | null;
  lastSalaryTransferDate?: string | null;
  officeLocationId?: string | null;
  workStartTime?: string | null;
  workEndTime?: string | null;
  projectLatitude?: number | null;
  projectLongitude?: number | null;
  projectRadiusMeters?: number | null;
  isActive?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  jobTitle: string | null;
  employeeCode: string | null;
  salary: number | null;
  lastSalaryTransferDate: string | null;
  officeLocationId: string | null;
  workStartTime: string | null;
  workEndTime: string | null;
  projectLatitude: number | null;
  projectLongitude: number | null;
  projectRadiusMeters: number | null;
  isActive: boolean;
  role: {
    id: string;
    name: UserRole;
    description: string | null;
  };
  department: {
    id: string;
    name: string;
  } | null;
  employeeType: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedUsers {
  users: UserProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserManagementStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  securityAlerts: number;
  growthPercent: number | null;
  recentModifications: number;
}
