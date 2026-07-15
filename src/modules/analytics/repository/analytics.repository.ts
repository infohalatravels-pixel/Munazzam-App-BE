import { supabase } from '../../../database/supabase.js';
import { AppError } from '../../../shared/errors/index.js';
import { ATTENDANCE_TYPES } from '../../../shared/constants/index.js';

export class AnalyticsRepository {
  async countActiveUsers(): Promise<number> {
    const { count, error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to count users', 500, 'DATABASE_ERROR', error);
    }

    return count ?? 0;
  }

  async countUsersByRole(roleName: string): Promise<number> {
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', roleName)
      .is('deleted_at', null)
      .maybeSingle();

    if (roleError || !role) {
      return 0;
    }

    const { count, error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role_id', role.id)
      .eq('is_active', true)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to count users by role', 500, 'DATABASE_ERROR', error);
    }

    return count ?? 0;
  }

  async countAttendanceByType(
    type: string,
    startDate: string,
    endDate: string,
    userId?: string,
  ): Promise<number> {
    let builder = supabase
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('type', type)
      .gte('marked_at', startDate)
      .lte('marked_at', endDate)
      .is('deleted_at', null);

    if (userId) {
      builder = builder.eq('user_id', userId);
    }

    const { count, error } = await builder;

    if (error) {
      throw new AppError('Failed to count attendance', 500, 'DATABASE_ERROR', error);
    }

    return count ?? 0;
  }

  async countDistinctCheckIns(startDate: string, endDate: string): Promise<number> {
    const types = [ATTENDANCE_TYPES.CHECK_IN, ATTENDANCE_TYPES.LATE];
    const { data, error } = await supabase
      .from('attendance')
      .select('user_id')
      .in('type', types)
      .gte('marked_at', startDate)
      .lte('marked_at', endDate)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to count check-ins', 500, 'DATABASE_ERROR', error);
    }

    return new Set((data ?? []).map((r) => r.user_id)).size;
  }

  async countRecentActivity(since: string): Promise<number> {
    const { count, error } = await supabase
      .from('activity_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to count activity', 500, 'DATABASE_ERROR', error);
    }

    return count ?? 0;
  }

  async getDepartmentBreakdown(): Promise<
    Array<{
      departmentId: string | null;
      departmentName: string;
      employeeCount: number;
    }>
  > {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, department_id, departments:department_id ( id, name )')
      .eq('is_active', true)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to fetch department breakdown', 500, 'DATABASE_ERROR', error);
    }

    const map = new Map<string, { departmentId: string | null; departmentName: string; count: number }>();

    for (const user of users ?? []) {
      const deptRaw = user.departments;
      const dept = Array.isArray(deptRaw) ? deptRaw[0] : deptRaw;
      const deptTyped = dept as { id: string; name: string } | null | undefined;
      const key = deptTyped?.id ?? 'unassigned';
      const existing = map.get(key);

      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, {
          departmentId: deptTyped?.id ?? null,
          departmentName: deptTyped?.name ?? 'Unassigned',
          count: 1,
        });
      }
    }

    return Array.from(map.values()).map((d) => ({
      departmentId: d.departmentId,
      departmentName: d.departmentName,
      employeeCount: d.count,
    }));
  }

  async getPresentUserIdsToday(startDate: string, endDate: string): Promise<Set<string>> {
    const types = [ATTENDANCE_TYPES.CHECK_IN, ATTENDANCE_TYPES.LATE];
    const { data, error } = await supabase
      .from('attendance')
      .select('user_id')
      .in('type', types)
      .gte('marked_at', startDate)
      .lte('marked_at', endDate)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to fetch present users', 500, 'DATABASE_ERROR', error);
    }

    return new Set((data ?? []).map((r) => r.user_id));
  }

  async getRecentAttendanceForUser(
    userId: string,
    limit: number,
  ): Promise<Array<{ id: string; type: string; marked_at: string; is_within_radius: boolean | null }>> {
    const { data, error } = await supabase
      .from('attendance')
      .select('id, type, marked_at, is_within_radius')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('marked_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new AppError('Failed to fetch recent attendance', 500, 'DATABASE_ERROR', error);
    }

    return data ?? [];
  }

  async countDepartments(): Promise<number> {
    const { count, error } = await supabase
      .from('departments')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to count departments', 500, 'DATABASE_ERROR', error);
    }

    return count ?? 0;
  }

  async countUsersByEmployeeType(typeName: string): Promise<number> {
    const { data: typeRow, error: typeError } = await supabase
      .from('employee_types')
      .select('id')
      .eq('name', typeName)
      .is('deleted_at', null)
      .maybeSingle();

    if (typeError || !typeRow) {
      return 0;
    }

    const { count, error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('employee_type_id', typeRow.id)
      .eq('is_active', true)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to count users by employee type', 500, 'DATABASE_ERROR', error);
    }

    return count ?? 0;
  }

  async countUsersCreatedBetween(startDate: string, endDate: string): Promise<number> {
    const { count, error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to count new users', 500, 'DATABASE_ERROR', error);
    }

    return count ?? 0;
  }

  async getRecentActivityLogs(limit: number): Promise<
    Array<{
      id: string;
      action: string;
      metadata: Record<string, unknown>;
      ip: string | null;
      created_at: string;
      users: { first_name: string; last_name: string; email: string } | null;
    }>
  > {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('id, action, metadata, ip, created_at, users:user_id ( first_name, last_name, email )')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new AppError('Failed to fetch activity logs', 500, 'DATABASE_ERROR', error);
    }

    return (data ?? []).map((row) => {
      const userRaw = row.users;
      const user = Array.isArray(userRaw) ? userRaw[0] : userRaw;
      return {
        id: row.id,
        action: row.action,
        metadata: (row.metadata as Record<string, unknown>) ?? {},
        ip: row.ip,
        created_at: row.created_at,
        users: user as { first_name: string; last_name: string; email: string } | null,
      };
    });
  }

  async getActiveWorkforceUsers(): Promise<
    Array<{
      id: string;
      firstName: string;
      lastName: string;
      departmentName: string;
    }>
  > {
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id, name')
      .in('name', ['employee', 'hr'])
      .is('deleted_at', null);

    if (rolesError) {
      throw new AppError('Failed to fetch roles', 500, 'DATABASE_ERROR', rolesError);
    }

    const roleIds = (roles ?? []).map((r) => r.id);
    if (!roleIds.length) return [];

    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, departments:department_id ( name )')
      .in('role_id', roleIds)
      .eq('is_active', true)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to fetch workforce users', 500, 'DATABASE_ERROR', error);
    }

    return (data ?? []).map((user) => {
      const deptRaw = user.departments;
      const dept = Array.isArray(deptRaw) ? deptRaw[0] : deptRaw;
      const deptName = (dept as { name: string } | null | undefined)?.name ?? 'Unassigned';
      return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        departmentName: deptName,
      };
    });
  }

  async getOnLeaveUserIds(startDate: string, endDate: string): Promise<Set<string>> {
    const { data, error } = await supabase
      .from('attendance')
      .select('user_id')
      .eq('type', ATTENDANCE_TYPES.LEAVE)
      .gte('marked_at', startDate)
      .lte('marked_at', endDate)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to fetch leave records', 500, 'DATABASE_ERROR', error);
    }

    return new Set((data ?? []).map((r) => r.user_id));
  }

  async getLateRecordsToday(
    startDate: string,
    endDate: string,
  ): Promise<Array<{ userId: string; markedAt: string }>> {
    const { data, error } = await supabase
      .from('attendance')
      .select('user_id, marked_at')
      .eq('type', ATTENDANCE_TYPES.LATE)
      .gte('marked_at', startDate)
      .lte('marked_at', endDate)
      .is('deleted_at', null)
      .order('marked_at', { ascending: false });

    if (error) {
      throw new AppError('Failed to fetch late records', 500, 'DATABASE_ERROR', error);
    }

    return (data ?? []).map((r) => ({ userId: r.user_id, markedAt: r.marked_at }));
  }

  async getUserTodayStatus(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<'not_checked_in' | 'checked_in' | 'checked_out' | 'late' | 'on_leave'> {
    const { data, error } = await supabase
      .from('attendance')
      .select('type')
      .eq('user_id', userId)
      .gte('marked_at', startDate)
      .lte('marked_at', endDate)
      .is('deleted_at', null)
      .order('marked_at', { ascending: false });

    if (error) {
      throw new AppError('Failed to fetch today status', 500, 'DATABASE_ERROR', error);
    }

    const types = (data ?? []).map((r) => r.type);

    if (types.includes(ATTENDANCE_TYPES.LEAVE)) return 'on_leave';
    if (types.includes(ATTENDANCE_TYPES.CHECK_OUT)) return 'checked_out';
    if (types.includes(ATTENDANCE_TYPES.LATE)) return 'late';
    if (types.includes(ATTENDANCE_TYPES.CHECK_IN)) return 'checked_in';

    return 'not_checked_in';
  }
}

export const analyticsRepository = new AnalyticsRepository();
