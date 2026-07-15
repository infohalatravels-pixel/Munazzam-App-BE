import { describe, expect, it } from 'vitest';
import { groupAttendanceByDay } from './attendance-grouping.js';
import type { AttendanceRecord } from '../types/attendance.types.js';

function punch(
  overrides: Partial<AttendanceRecord> & Pick<AttendanceRecord, 'type' | 'markedAt'>,
): AttendanceRecord {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    userId: overrides.userId ?? 'user-1',
    type: overrides.type,
    latitude: overrides.latitude ?? 31.5,
    longitude: overrides.longitude ?? 74.24,
    address: overrides.address ?? '31.500000, 74.240000',
    device: overrides.device ?? 'Mobile',
    browser: overrides.browser ?? 'Chrome',
    distanceFromOffice: null,
    isWithinRadius: null,
    markedAt: overrides.markedAt,
    createdAt: overrides.createdAt ?? overrides.markedAt,
    user: overrides.user,
  };
}

describe('groupAttendanceByDay', () => {
  it('combines check-in and check-out into one day row', () => {
    const records = [
      punch({ id: 'out-1', type: 'check_out', markedAt: '2026-07-06T17:00:00.000Z' }),
      punch({ id: 'in-1', type: 'check_in', markedAt: '2026-07-06T08:00:00.000Z' }),
    ];

    const grouped = groupAttendanceByDay(records);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.checkIn?.id).toBe('in-1');
    expect(grouped[0]?.checkOut?.id).toBe('out-1');
    expect(grouped[0]?.status).toBe('complete');
  });
});
