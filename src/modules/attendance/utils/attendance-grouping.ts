import type { AttendanceRecord } from '../types/attendance.types.js';
import { getWorkDateKey } from '../../../shared/time/work-timezone.js';

export interface DailyAttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: AttendanceRecord | null;
  checkOut: AttendanceRecord | null;
  status: 'complete' | 'checked_in' | 'late' | 'incomplete' | 'absent';
  user?: AttendanceRecord['user'];
}

function getWorkDate(markedAt: string): string {
  return getWorkDateKey(new Date(markedAt));
}

export function groupAttendanceByDay(records: AttendanceRecord[]): DailyAttendanceRecord[] {
  const map = new Map<string, DailyAttendanceRecord>();
  const absentKeys = new Set<string>();

  for (const record of records) {
    const date = getWorkDate(record.markedAt);
    const key = `${record.userId}-${date}`;

    if (record.type === 'absent') {
      absentKeys.add(key);
    }

    if (!['check_in', 'check_out', 'late', 'absent'].includes(record.type)) continue;

    if (!map.has(key)) {
      map.set(key, {
        id: key,
        userId: record.userId,
        date,
        checkIn: null,
        checkOut: null,
        status: 'incomplete',
        user: record.user,
      });
    }

    const day = map.get(key)!;

    if (record.user && !day.user) {
      day.user = record.user;
    }

    if (record.type === 'check_in' || record.type === 'late') {
      if (!day.checkIn || new Date(record.markedAt) < new Date(day.checkIn.markedAt)) {
        day.checkIn = record;
      }
    }

    if (record.type === 'check_out') {
      if (!day.checkOut || new Date(record.markedAt) > new Date(day.checkOut.markedAt)) {
        day.checkOut = record;
      }
    }
  }

  for (const day of map.values()) {
    const key = `${day.userId}-${day.date}`;

    if (absentKeys.has(key)) {
      day.status = 'absent';
    } else if (day.checkIn && day.checkOut) {
      day.status = day.checkIn.type === 'late' ? 'late' : 'complete';
    } else if (day.checkIn) {
      day.status = day.checkIn.type === 'late' ? 'late' : 'checked_in';
    } else {
      day.status = 'incomplete';
    }
  }

  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
}

export function paginateDailyRecords(
  records: DailyAttendanceRecord[],
  page: number,
  limit: number,
): { records: DailyAttendanceRecord[]; total: number; totalPages: number } {
  const total = records.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;

  return {
    records: records.slice(start, start + limit),
    total,
    totalPages,
  };
}
