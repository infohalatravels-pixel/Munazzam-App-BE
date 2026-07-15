import type { UserRole } from '../../../shared/constants/index.js';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshInput {
  refreshToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  jobTitle: string | null;
  employeeCode: string | null;
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
