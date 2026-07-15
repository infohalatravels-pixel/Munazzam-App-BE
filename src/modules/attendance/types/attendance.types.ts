import type { AttendanceType } from '../../../shared/constants/index.js';

export interface AttendanceMarkInput {
  latitude: number;
  longitude: number;
  address?: string;
  device?: string;
  browser?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  type: AttendanceType;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  device: string | null;
  browser: string | null;
  distanceFromOffice: number | null;
  isWithinRadius: boolean | null;
  markedAt: string;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeCode: string | null;
  };
}

export interface AttendanceHistoryQuery {
  page: number;
  limit: number;
  userId?: string;
  type?: AttendanceType;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedAttendance {
  records: AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DailyAttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: AttendanceRecord | null;
  checkOut: AttendanceRecord | null;
  status: 'complete' | 'checked_in' | 'late' | 'incomplete' | 'absent';
  user?: AttendanceRecord['user'];
}

export interface PaginatedDailyAttendance {
  records: DailyAttendanceRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TodayAttendanceStatus {
  checkedIn: boolean;
  checkedOut: boolean;
  checkIn: AttendanceRecord | null;
  checkOut: AttendanceRecord | null;
  workStartTime: string;
  workEndTime: string;
  graceMinutes: number;
  halfShiftHours: number;
  clockRadiusMeters: number;
  hasAssignedLocation: boolean;
  assignedLocation: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
  } | null;
  clockInScheduleOpen: boolean;
  clockOutScheduleOpen: boolean;
  clockOutAvailableAt: string | null;
  isAbsent: boolean;
  checkInClassification: 'on_time' | 'late' | null;
}
