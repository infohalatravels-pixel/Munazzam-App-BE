import type { DbUserWithRelations } from '../../../database/types.js';
import type { UserRole } from '../../../shared/constants/index.js';
import type { UserProfile } from '../types/users.types.js';

export function mapUserToProfile(user: DbUserWithRelations): UserProfile {
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
    salary: user.salary != null ? Number(user.salary) : null,
    lastSalaryTransferDate: user.last_salary_transfer_date,
    officeLocationId: user.office_location_id ?? null,
    workStartTime: user.work_start_time ?? null,
    workEndTime: user.work_end_time ?? null,
    projectLatitude: user.project_latitude != null ? Number(user.project_latitude) : null,
    projectLongitude: user.project_longitude != null ? Number(user.project_longitude) : null,
    projectRadiusMeters:
      user.project_radius_meters != null ? Number(user.project_radius_meters) : null,
    isActive: user.is_active,
    role: {
      id: role.id,
      name: role.name as UserRole,
      description: role.description,
    },
    department: department
      ? { id: department.id, name: department.name }
      : null,
    employeeType: {
      id: employeeType.id,
      name: employeeType.name,
    },
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}
