import { USER_ROLES } from '../../../shared/constants/index.js';
import { ATTENDANCE_TYPES } from '../../../shared/constants/index.js';
import type { AuthenticatedUser } from '../../../types/auth.types.js';
import { analyticsRepository } from '../repository/analytics.repository.js';
import type {
  AdminDashboard,
  DashboardData,
  EmployeeDashboard,
  HrDashboard,
} from '../types/analytics.types.js';
import type { DashboardResponseDto } from '../dto/analytics.dto.js';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function formatLogMessage(
  action: string,
  metadata: Record<string, unknown>,
  actorName: string | null,
): string {
  switch (action) {
    case 'user.create':
      return `New user created: ${String(metadata.email ?? metadata.name ?? 'Unknown')}`;
    case 'user.update':
      return `User profile updated${metadata.email ? `: ${String(metadata.email)}` : ''}`;
    case 'user.delete':
      return 'User account deactivated';
    case 'auth.login':
      return actorName ? `${actorName} signed in` : 'User signed in';
    case 'auth.logout':
      return actorName ? `${actorName} signed out` : 'User signed out';
    case 'attendance.check_in':
      return 'Employee clocked in';
    case 'attendance.check_out':
      return 'Employee clocked out';
    default:
      return action.replace(/\./g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

function logSeverity(action: string): 'success' | 'info' | 'warning' | 'error' {
  if (action.startsWith('auth.login') || action === 'user.create' || action === 'attendance.check_in') {
    return 'success';
  }
  if (action === 'user.delete' || action.includes('failed')) {
    return 'error';
  }
  if (action.includes('reset') || action === 'attendance.check_out') {
    return 'warning';
  }
  return 'info';
}

function logSource(action: string, actorName: string | null, ip: string | null): string {
  if (action.startsWith('auth.')) return ip ? `Security • ${ip}` : 'Security Portal';
  if (action.startsWith('user.')) return actorName ? `${actorName}` : 'Admin Panel';
  if (action.startsWith('attendance.')) return 'Attendance System';
  return 'System';
}

function parseWorkStartMinutes(workStartTime: string): number {
  const [hours, minutes] = workStartTime.split(':').map(Number);
  return (hours ?? 8) * 60 + (minutes ?? 0);
}

function computeLateMinutes(markedAt: string, workStartTime: string, thresholdMinutes: number): number {
  const marked = new Date(markedAt);
  const startMinutes = parseWorkStartMinutes(workStartTime);
  const markedMinutes = marked.getHours() * 60 + marked.getMinutes();
  return Math.max(0, markedMinutes - startMinutes - thresholdMinutes);
}

export class AnalyticsService {
  async getDashboard(actor: AuthenticatedUser): Promise<DashboardResponseDto> {
    const today = this.getTodayRange();
    const month = this.getMonthRange();

    let dashboard: DashboardData;

    switch (actor.role) {
      case USER_ROLES.ADMIN:
        dashboard = await this.getAdminDashboard(today.start, today.end, month.start, month.end);
        break;
      case USER_ROLES.HR:
        dashboard = await this.getHrDashboard(today.start, today.end);
        break;
      default:
        dashboard = await this.getEmployeeDashboard(actor.id, today.start, today.end, month.start, month.end);
    }

    return {
      dashboard,
      role: actor.role,
      generatedAt: new Date().toISOString(),
    };
  }

  private async getAdminDashboard(
    dayStart: string,
    dayEnd: string,
    monthStart: string,
    monthEnd: string,
  ): Promise<AdminDashboard> {
    const totalEmployees = await analyticsRepository.countUsersByRole(USER_ROLES.EMPLOYEE);
    const activeEmployees = await analyticsRepository.countActiveUsers();
    const todayPresent = await analyticsRepository.countDistinctCheckIns(dayStart, dayEnd);
    const todayLate = await analyticsRepository.countAttendanceByType(
      ATTENDANCE_TYPES.LATE,
      dayStart,
      dayEnd,
    );
    const todayOnLeave = await analyticsRepository.countAttendanceByType(
      ATTENDANCE_TYPES.LEAVE,
      dayStart,
      dayEnd,
    );

    const hrCount = await analyticsRepository.countUsersByRole(USER_ROLES.HR);
    const workforce = totalEmployees + hrCount;
    const todayAbsent = Math.max(0, workforce - todayPresent - todayOnLeave);
    const attendanceRate =
      workforce > 0 ? Math.round((todayPresent / workforce) * 10000) / 100 : 0;

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentActivityCount = await analyticsRepository.countRecentActivity(weekAgo);

    const departmentCount = await analyticsRepository.countDepartments();
    const departments = await analyticsRepository.getDepartmentBreakdown();
    const totalDeptEmployees = departments.reduce((sum, d) => sum + d.employeeCount, 0);
    const departmentShare = departments
      .map((dept) => ({
        departmentId: dept.departmentId,
        departmentName: dept.departmentName,
        employeeCount: dept.employeeCount,
        sharePercent:
          totalDeptEmployees > 0
            ? Math.round((dept.employeeCount / totalDeptEmployees) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.employeeCount - a.employeeCount)
      .slice(0, 5);

    const permanent = await analyticsRepository.countUsersByEmployeeType('permanent');
    const contract = await analyticsRepository.countUsersByEmployeeType('contract');

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const recentHires = await analyticsRepository.countUsersCreatedBetween(
      thirtyDaysAgo.toISOString(),
      now.toISOString(),
    );
    const priorHires = await analyticsRepository.countUsersCreatedBetween(
      sixtyDaysAgo.toISOString(),
      thirtyDaysAgo.toISOString(),
    );
    const employeeGrowthPercent =
      priorHires > 0
        ? Math.round(((recentHires - priorHires) / priorHires) * 1000) / 10
        : recentHires > 0
          ? 100
          : null;

    const attendanceTrends = await this.buildAttendanceTrends(workforce, 7);

    const rawLogs = await analyticsRepository.getRecentActivityLogs(5);
    const systemLogs = rawLogs.map((log) => {
      const actorName = log.users
        ? `${log.users.first_name} ${log.users.last_name}`.trim()
        : null;
      return {
        id: log.id,
        action: log.action,
        message: formatLogMessage(log.action, log.metadata, actorName),
        source: logSource(log.action, actorName, log.ip),
        createdAt: log.created_at,
        severity: logSeverity(log.action),
      };
    });

    const criticalAlerts = await this.buildCriticalAlerts(dayStart, dayEnd, workforce);

    void monthStart;
    void monthEnd;

    return {
      totalEmployees,
      activeEmployees,
      todayPresent,
      todayLate,
      todayAbsent,
      todayOnLeave,
      attendanceRate,
      recentActivityCount,
      departmentCount,
      departmentShare,
      employeeGrowthPercent,
      contractStatus: {
        permanent,
        contract,
        total: permanent + contract,
      },
      attendanceTrends,
      systemLogs,
      criticalAlerts,
    };
  }

  private async buildAttendanceTrends(
    workforce: number,
    days: number,
  ): Promise<AdminDashboard['attendanceTrends']> {
    const trends: AdminDashboard['attendanceTrends'] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
      const presentCount = await analyticsRepository.countDistinctCheckIns(
        start.toISOString(),
        end.toISOString(),
      );
      const rate =
        workforce > 0 ? Math.round((presentCount / workforce) * 10000) / 100 : 0;

      trends.push({
        date: start.toISOString().slice(0, 10),
        label: DAY_LABELS[start.getDay()] ?? 'Day',
        presentCount,
        rate,
      });
    }

    return trends;
  }

  private async buildCriticalAlerts(
    dayStart: string,
    dayEnd: string,
    workforce: number,
  ): Promise<AdminDashboard['criticalAlerts']> {
    if (workforce === 0) return [];

    const { settingsRepository } = await import('../../../shared/repositories/settings.repository.js');
    const officeConfig = await settingsRepository.getOfficeConfig();
    const workStartTime = officeConfig.workStartTime;
    const lateThreshold = officeConfig.lateThresholdMinutes;

    const workforceUsers = await analyticsRepository.getActiveWorkforceUsers();
    const presentIds = await analyticsRepository.getPresentUserIdsToday(dayStart, dayEnd);
    const onLeaveIds = await analyticsRepository.getOnLeaveUserIds(dayStart, dayEnd);
    const lateRecords = await analyticsRepository.getLateRecordsToday(dayStart, dayEnd);

    const lateByUser = new Map<string, string>();
    for (const record of lateRecords) {
      if (!lateByUser.has(record.userId)) {
        lateByUser.set(record.userId, record.markedAt);
      }
    }

    const alerts: AdminDashboard['criticalAlerts'] = [];

    for (const user of workforceUsers) {
      if (onLeaveIds.has(user.id)) continue;

      if (lateByUser.has(user.id)) {
        const markedAt = lateByUser.get(user.id)!;
        alerts.push({
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          departmentName: user.departmentName,
          status: 'late',
          lateMinutes: computeLateMinutes(markedAt, workStartTime, lateThreshold),
          timeLogged: markedAt,
        });
        continue;
      }

      if (!presentIds.has(user.id)) {
        alerts.push({
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          departmentName: user.departmentName,
          status: 'absent',
          lateMinutes: null,
          timeLogged: null,
        });
      }
    }

    return alerts
      .sort((a, b) => {
        if (a.status === b.status) return a.lastName.localeCompare(b.lastName);
        return a.status === 'absent' ? -1 : 1;
      })
      .slice(0, 10);
  }

  private async getHrDashboard(dayStart: string, dayEnd: string): Promise<HrDashboard> {
    const totalEmployees = await analyticsRepository.countUsersByRole(USER_ROLES.EMPLOYEE);
    const todayPresent = await analyticsRepository.countDistinctCheckIns(dayStart, dayEnd);
    const todayLate = await analyticsRepository.countAttendanceByType(
      ATTENDANCE_TYPES.LATE,
      dayStart,
      dayEnd,
    );
    const todayOnLeave = await analyticsRepository.countAttendanceByType(
      ATTENDANCE_TYPES.LEAVE,
      dayStart,
      dayEnd,
    );
    const todayAbsent = Math.max(0, totalEmployees - todayPresent - todayOnLeave);

    const departments = await analyticsRepository.getDepartmentBreakdown();
    const presentIds = await analyticsRepository.getPresentUserIdsToday(dayStart, dayEnd);

    const { supabase } = await import('../../../database/supabase.js');
    const departmentBreakdown = await Promise.all(
      departments.map(async (dept) => {
        let presentToday = 0;

        if (dept.departmentId) {
          const { data } = await supabase
            .from('users')
            .select('id')
            .eq('department_id', dept.departmentId)
            .eq('is_active', true)
            .is('deleted_at', null);

          presentToday = (data ?? []).filter((u) => presentIds.has(u.id)).length;
        } else {
          const { data } = await supabase
            .from('users')
            .select('id')
            .is('department_id', null)
            .eq('is_active', true)
            .is('deleted_at', null);

          presentToday = (data ?? []).filter((u) => presentIds.has(u.id)).length;
        }

        return {
          departmentId: dept.departmentId,
          departmentName: dept.departmentName,
          employeeCount: dept.employeeCount,
          presentToday,
        };
      }),
    );

    return {
      totalEmployees,
      todayPresent,
      todayLate,
      todayAbsent,
      departmentBreakdown,
    };
  }

  private async getEmployeeDashboard(
    userId: string,
    dayStart: string,
    dayEnd: string,
    monthStart: string,
    monthEnd: string,
  ): Promise<EmployeeDashboard> {
    const todayStatus = await analyticsRepository.getUserTodayStatus(userId, dayStart, dayEnd);

    const presentDays = await analyticsRepository.countAttendanceByType(
      ATTENDANCE_TYPES.CHECK_IN,
      monthStart,
      monthEnd,
      userId,
    );
    const lateDays = await analyticsRepository.countAttendanceByType(
      ATTENDANCE_TYPES.LATE,
      monthStart,
      monthEnd,
      userId,
    );
    const absentDays = await analyticsRepository.countAttendanceByType(
      ATTENDANCE_TYPES.ABSENT,
      monthStart,
      monthEnd,
      userId,
    );
    const leaveDays = await analyticsRepository.countAttendanceByType(
      ATTENDANCE_TYPES.LEAVE,
      monthStart,
      monthEnd,
      userId,
    );

    const recent = await analyticsRepository.getRecentAttendanceForUser(userId, 5);

    return {
      todayStatus,
      thisMonth: {
        presentDays,
        lateDays,
        absentDays,
        leaveDays,
      },
      recentAttendance: recent.map((r) => ({
        id: r.id,
        type: r.type,
        markedAt: r.marked_at,
        isWithinRadius: r.is_within_radius,
      })),
    };
  }

  private getTodayRange(): { start: string; end: string } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  private getMonthRange(): { start: string; end: string } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  }
}

export const analyticsService = new AnalyticsService();
