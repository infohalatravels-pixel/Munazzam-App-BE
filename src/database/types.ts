import type { AttendanceType, UserRole } from '../shared/constants/index.js';

export interface DbTimestamps {
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DbRole extends DbTimestamps {
  id: string;
  name: UserRole;
  description: string | null;
}

export interface DbDepartment extends DbTimestamps {
  id: string;
  name: string;
  description: string | null;
}

export interface DbEmployeeType extends DbTimestamps {
  id: string;
  name: string;
  description: string | null;
}

export interface DbUser extends DbTimestamps {
  id: string;
  email: string;
  password_hash: string;
  role_id: string;
  department_id: string | null;
  employee_type_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  job_title: string | null;
  employee_code: string | null;
  salary: number | null;
  last_salary_transfer_date: string | null;
  office_location_id: string | null;
  work_start_time: string | null;
  work_end_time: string | null;
  project_latitude: number | null;
  project_longitude: number | null;
  project_radius_meters: number | null;
  is_active: boolean;
}

export interface DbUserWithRelations extends DbUser {
  roles: Pick<DbRole, 'id' | 'name' | 'description'> | null;
  departments: Pick<DbDepartment, 'id' | 'name'> | null;
  employee_types: Pick<DbEmployeeType, 'id' | 'name'> | null;
}

export interface DbRefreshToken extends DbTimestamps {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
  user_agent: string | null;
  ip: string | null;
}

export interface DbAttendance extends DbTimestamps {
  id: string;
  user_id: string;
  type: AttendanceType;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  device: string | null;
  browser: string | null;
  distance_from_office: number | null;
  is_within_radius: boolean | null;
  marked_at: string;
}

export interface DbSetting extends DbTimestamps {
  id: string;
  key: string;
  value: unknown;
}

export interface DbActivityLog extends DbTimestamps {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  ip: string | null;
}

export interface DbAnnouncement extends DbTimestamps {
  id: string;
  title: string;
  content: string;
  created_by: string;
  is_active: boolean;
  published_at: string | null;
}
