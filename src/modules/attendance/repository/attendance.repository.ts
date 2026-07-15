import { supabase } from '../../../database/supabase.js';
import type { DbAttendance } from '../../../database/types.js';
import { AppError } from '../../../shared/errors/index.js';
import type { AttendanceType } from '../../../shared/constants/index.js';
import type { AttendanceHistoryQuery } from '../types/attendance.types.js';

const ATTENDANCE_WITH_USER = `
  *,
  users:user_id ( id, first_name, last_name, email, employee_code )
`;

export interface AttendanceRow extends DbAttendance {
  users: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    employee_code: string | null;
  } | null;
}

export interface CreateAttendanceInput {
  userId: string;
  type: AttendanceType;
  latitude: number | null;
  longitude: number | null;
  address?: string | null;
  device?: string | null;
  browser?: string | null;
  distanceFromOffice: number | null;
  isWithinRadius: boolean | null;
  markedAt?: Date;
}

export class AttendanceRepository {
  async create(input: CreateAttendanceInput): Promise<AttendanceRow> {
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        user_id: input.userId,
        type: input.type,
        latitude: input.latitude,
        longitude: input.longitude,
        address: input.address ?? null,
        device: input.device ?? null,
        browser: input.browser ?? null,
        distance_from_office: input.distanceFromOffice,
        is_within_radius: input.isWithinRadius,
        marked_at: (input.markedAt ?? new Date()).toISOString(),
      })
      .select(ATTENDANCE_WITH_USER)
      .single();

    if (error || !data) {
      throw new AppError('Failed to create attendance record', 500, 'DATABASE_ERROR', error);
    }

    return data as AttendanceRow;
  }

  async findLatestByUserAndType(
    userId: string,
    type: AttendanceType,
    dateStart: string,
    dateEnd: string,
  ): Promise<DbAttendance | null> {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .gte('marked_at', dateStart)
      .lte('marked_at', dateEnd)
      .is('deleted_at', null)
      .order('marked_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new AppError('Failed to fetch attendance', 500, 'DATABASE_ERROR', error);
    }

    return data;
  }

  async findHistory(
    query: AttendanceHistoryQuery,
    scopedUserId?: string,
  ): Promise<{ records: AttendanceRow[]; total: number }> {
    const offset = (query.page - 1) * query.limit;

    let builder = supabase
      .from('attendance')
      .select(ATTENDANCE_WITH_USER, { count: 'exact' })
      .is('deleted_at', null)
      .order('marked_at', { ascending: false })
      .range(offset, offset + query.limit - 1);

    const userId = scopedUserId ?? query.userId;
    if (userId) {
      builder = builder.eq('user_id', userId);
    }

    if (query.type) {
      builder = builder.eq('type', query.type);
    }

    if (query.startDate) {
      builder = builder.gte('marked_at', query.startDate);
    }

    if (query.endDate) {
      builder = builder.lte('marked_at', query.endDate);
    }

    const { data, error, count } = await builder;

    if (error) {
      throw new AppError('Failed to fetch attendance history', 500, 'DATABASE_ERROR', error);
    }

    return {
      records: (data ?? []) as AttendanceRow[],
      total: count ?? 0,
    };
  }

  async findAllForDailySummary(
    query: Pick<AttendanceHistoryQuery, 'userId' | 'type' | 'startDate' | 'endDate'>,
    scopedUserId?: string,
    maxRecords = 5000,
  ): Promise<AttendanceRow[]> {
    let builder = supabase
      .from('attendance')
      .select(ATTENDANCE_WITH_USER)
      .is('deleted_at', null)
      .in('type', ['check_in', 'check_out', 'late'])
      .order('marked_at', { ascending: false })
      .limit(maxRecords);

    const userId = scopedUserId ?? query.userId;
    if (userId) {
      builder = builder.eq('user_id', userId);
    }

    if (query.type) {
      builder = builder.eq('type', query.type);
    }

    if (query.startDate) {
      builder = builder.gte('marked_at', query.startDate);
    }

    if (query.endDate) {
      builder = builder.lte('marked_at', query.endDate);
    }

    const { data, error } = await builder;

    if (error) {
      throw new AppError('Failed to fetch attendance for daily summary', 500, 'DATABASE_ERROR', error);
    }

    return (data ?? []) as AttendanceRow[];
  }

  async countByTypeForDateRange(
    type: AttendanceType,
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

  async countDistinctUsersForDateRange(startDate: string, endDate: string): Promise<number> {
    const { data, error } = await supabase
      .from('attendance')
      .select('user_id')
      .gte('marked_at', startDate)
      .lte('marked_at', endDate)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to count attendance users', 500, 'DATABASE_ERROR', error);
    }

    const unique = new Set((data ?? []).map((r) => r.user_id));
    return unique.size;
  }
}

export const attendanceRepository = new AttendanceRepository();
