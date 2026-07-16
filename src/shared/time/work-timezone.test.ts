import { describe, expect, it } from 'vitest';
import {
  getWorkDateKey,
  getWorkDateRangeIso,
  isAtOrAfterWorkTime,
  parseWorkTimeToMinutes,
} from './work-timezone.js';

describe('work-timezone (Asia/Qatar)', () => {
  it('parses HH:mm to minutes', () => {
    expect(parseWorkTimeToMinutes('11:00')).toBe(11 * 60);
    expect(parseWorkTimeToMinutes('21:30')).toBe(21 * 60 + 30);
  });

  it('maps UTC instant to Qatar calendar date', () => {
    // 2026-07-16 01:30 UTC = 04:30 Qatar → still 16 Jul
    expect(getWorkDateKey(new Date('2026-07-16T01:30:00.000Z'))).toBe('2026-07-16');
    // 2026-07-15 22:00 UTC = 01:00 Qatar on 16 Jul
    expect(getWorkDateKey(new Date('2026-07-15T22:00:00.000Z'))).toBe('2026-07-16');
  });

  it('builds Qatar day bounds in UTC', () => {
    const { start, end } = getWorkDateRangeIso('2026-07-16');
    expect(start).toBe('2026-07-15T21:00:00.000Z');
    expect(end).toBe('2026-07-16T20:59:59.999Z');
  });

  it('opens schedule using Qatar wall-clock', () => {
    // 08:00 UTC = 11:00 Qatar → open for 11:00 start
    expect(isAtOrAfterWorkTime('11:00', new Date('2026-07-16T08:00:00.000Z'))).toBe(true);
    // 07:59 UTC = 10:59 Qatar → still closed
    expect(isAtOrAfterWorkTime('11:00', new Date('2026-07-16T07:59:00.000Z'))).toBe(false);
  });
});
