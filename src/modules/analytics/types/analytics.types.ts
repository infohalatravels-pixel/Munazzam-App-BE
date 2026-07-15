export interface AdminDashboard {
  totalEmployees: number;
  activeEmployees: number;
  todayPresent: number;
  todayLate: number;
  todayAbsent: number;
  todayOnLeave: number;
  attendanceRate: number;
  recentActivityCount: number;
  departmentCount: number;
  departmentShare: Array<{
    departmentId: string | null;
    departmentName: string;
    employeeCount: number;
    sharePercent: number;
  }>;
  employeeGrowthPercent: number | null;
  contractStatus: {
    permanent: number;
    contract: number;
    total: number;
  };
  attendanceTrends: Array<{
    date: string;
    label: string;
    presentCount: number;
    rate: number;
  }>;
  systemLogs: Array<{
    id: string;
    action: string;
    message: string;
    source: string;
    createdAt: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>;
  criticalAlerts: Array<{
    userId: string;
    firstName: string;
    lastName: string;
    departmentName: string;
    status: 'absent' | 'late';
    lateMinutes: number | null;
    timeLogged: string | null;
  }>;
}

export interface HrDashboard {
  totalEmployees: number;
  todayPresent: number;
  todayLate: number;
  todayAbsent: number;
  departmentBreakdown: Array<{
    departmentId: string | null;
    departmentName: string;
    employeeCount: number;
    presentToday: number;
  }>;
}

export interface EmployeeDashboard {
  todayStatus: 'not_checked_in' | 'checked_in' | 'checked_out' | 'late' | 'on_leave';
  thisMonth: {
    presentDays: number;
    lateDays: number;
    absentDays: number;
    leaveDays: number;
  };
  recentAttendance: Array<{
    id: string;
    type: string;
    markedAt: string;
    isWithinRadius: boolean | null;
  }>;
}

export type DashboardData = AdminDashboard | HrDashboard | EmployeeDashboard;
