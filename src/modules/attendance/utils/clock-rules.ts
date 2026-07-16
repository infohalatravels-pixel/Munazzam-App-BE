import { calculateDistanceMeters, isWithinRadius } from '../../../utils/geo.js';
import {
  getMinutesInWorkZone,
  isAtOrAfterWorkTime,
  parseWorkTimeToMinutes,
  WORK_TIMEZONE,
} from '../../../shared/time/work-timezone.js';

/** Fixed geofence for clock in/out (meters). */
export const CLOCK_RADIUS_METERS = 150;
/** Minutes after scheduled check-in that still count as on time. */
export const CLOCK_GRACE_MINUTES = 15;
/** Hours after clock-in before clock-out is allowed. */
export const HALF_SHIFT_HOURS = 4;

export { WORK_TIMEZONE };

export interface AssignedProjectLocation {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

/**
 * Instant of today's scheduled work time in Asia/Qatar, as a Date (UTC ms).
 * Used for late grace calculations.
 */
export function parseWorkTimeToday(workTime: string, now = new Date()): Date {
  const targetMinutes = parseWorkTimeToMinutes(workTime);
  const currentMinutes = getMinutesInWorkZone(now);
  const diffMs = (targetMinutes - currentMinutes) * 60 * 1000;
  return new Date(now.getTime() + diffMs);
}

export function isClockInScheduleOpen(workStartTime: string, now = new Date()): boolean {
  return isAtOrAfterWorkTime(workStartTime, now);
}

export function isLateCheckIn(
  workStartTime: string,
  graceMinutes = CLOCK_GRACE_MINUTES,
  now = new Date(),
): boolean {
  const start = parseWorkTimeToday(workStartTime, now);
  const graceEnds = new Date(start.getTime() + graceMinutes * 60 * 1000);
  return now.getTime() > graceEnds.getTime();
}

export function getClockOutAvailableAt(checkInMarkedAt: string): Date {
  return new Date(new Date(checkInMarkedAt).getTime() + HALF_SHIFT_HOURS * 60 * 60 * 1000);
}

export function isClockOutScheduleOpen(checkInMarkedAt: string, now = new Date()): boolean {
  return now.getTime() >= getClockOutAvailableAt(checkInMarkedAt).getTime();
}

export function evaluateGeofence(
  userLat: number,
  userLng: number,
  assigned: AssignedProjectLocation,
): { distanceMeters: number; isWithinRadius: boolean } {
  const distanceMeters = Math.round(
    calculateDistanceMeters(userLat, userLng, assigned.latitude, assigned.longitude),
  );
  return {
    distanceMeters,
    isWithinRadius: isWithinRadius(
      userLat,
      userLng,
      assigned.latitude,
      assigned.longitude,
      assigned.radiusMeters,
    ),
  };
}
