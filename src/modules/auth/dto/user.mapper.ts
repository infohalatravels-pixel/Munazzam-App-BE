import type { DbUserWithRelations } from '../../../database/types.js';
import type { UserRole } from '../../../shared/constants/index.js';
import type { AuthUserProfile } from '../types/auth.types.js';

export function mapUserToProfile(user: DbUserWithRelations): AuthUserProfile {
  const role = user.roles;
  const department = user.departments;
  const employeeType = user.employee_types;

  if (!role || !employeeType) {
    throw new Error('User is missing required relations');
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    avatarUrl: user.avatar_url,
    jobTitle: user.job_title,
    employeeCode: user.employee_code,
    isActive: user.is_active,
    role: {
      id: role.id,
      name: role.name as UserRole,
      description: role.description,
    },
    department: department
      ? {
          id: department.id,
          name: department.name,
        }
      : null,
    employeeType: {
      id: employeeType.id,
      name: employeeType.name,
    },
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}
