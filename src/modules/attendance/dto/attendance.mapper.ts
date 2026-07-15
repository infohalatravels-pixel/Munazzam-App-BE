import type { DbAttendance } from '../../../database/types.js';
import type { AttendanceRow } from '../repository/attendance.repository.js';
import type { AttendanceRecord } from '../types/attendance.types.js';

export function mapDbAttendance(row: DbAttendance): AttendanceRecord {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    latitude: row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== null ? Number(row.longitude) : null,
    address: row.address,
    device: row.device,
    browser: row.browser,
    distanceFromOffice:
      row.distance_from_office !== null ? Number(row.distance_from_office) : null,
    isWithinRadius: row.is_within_radius,
    markedAt: row.marked_at,
    createdAt: row.created_at,
  };
}

export function mapAttendanceRecord(row: AttendanceRow, includeUser = false): AttendanceRecord {
  const record: AttendanceRecord = {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    latitude: row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== null ? Number(row.longitude) : null,
    address: row.address,
    device: row.device,
    browser: row.browser,
    distanceFromOffice:
      row.distance_from_office !== null ? Number(row.distance_from_office) : null,
    isWithinRadius: row.is_within_radius,
    markedAt: row.marked_at,
    createdAt: row.created_at,
  };

  if (includeUser && row.users) {
    record.user = {
      id: row.users.id,
      firstName: row.users.first_name,
      lastName: row.users.last_name,
      email: row.users.email,
      employeeCode: row.users.employee_code,
    };
  }

  return record;
}
