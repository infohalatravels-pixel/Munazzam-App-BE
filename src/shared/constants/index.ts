export const USER_ROLES = {
  ADMIN: 'admin',
  HR: 'hr',
  EMPLOYEE: 'employee',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ATTENDANCE_TYPES = {
  CHECK_IN: 'check_in',
  CHECK_OUT: 'check_out',
  LATE: 'late',
  ABSENT: 'absent',
  LEAVE: 'leave',
  HALF_DAY: 'half_day',
} as const;

export type AttendanceType = (typeof ATTENDANCE_TYPES)[keyof typeof ATTENDANCE_TYPES];

export const EMPLOYEE_TYPES = {
  PERMANENT: 'permanent',
  CONTRACT: 'contract',
} as const;

export type EmployeeType = (typeof EMPLOYEE_TYPES)[keyof typeof EMPLOYEE_TYPES];
