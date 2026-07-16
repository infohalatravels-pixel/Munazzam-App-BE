/** Business / attendance calendar timezone (Qatar, UTC+3, no DST). */
export const WORK_TIMEZONE = 'Asia/Qatar';

/** Fixed offset used for day-bound ISO strings (Asia/Qatar has no DST). */
const WORK_OFFSET = '+03:00';

export function getWorkDateKey(date: Date = new Date(), timeZone = WORK_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Minutes since midnight in the work timezone (0–1439). */
export function getMinutesInWorkZone(date: Date = new Date(), timeZone = WORK_TIMEZONE): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return hour * 60 + minute;
}

/** Parse "HH:mm" or "HH:mm:ss" to minutes since midnight. */
export function parseWorkTimeToMinutes(workTime: string): number {
  const [hours, minutes] = workTime.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function isAtOrAfterWorkTime(
  workTime: string,
  now: Date = new Date(),
  timeZone = WORK_TIMEZONE,
): boolean {
  return getMinutesInWorkZone(now, timeZone) >= parseWorkTimeToMinutes(workTime);
}

/**
 * UTC ISO bounds for a calendar day in the work timezone.
 * Example: 2026-07-16 in Asia/Qatar → 2026-07-15T21:00:00.000Z … 2026-07-16T20:59:59.999Z
 */
export function getWorkDateRangeIso(dateKey: string): { start: string; end: string } {
  const start = new Date(`${dateKey}T00:00:00${WORK_OFFSET}`);
  const end = new Date(`${dateKey}T23:59:59.999${WORK_OFFSET}`);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function getTodayWorkDateRangeIso(now: Date = new Date()): { start: string; end: string } {
  return getWorkDateRangeIso(getWorkDateKey(now));
}

export function formatWorkZoneTime(date: Date = new Date(), timeZone = WORK_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}
