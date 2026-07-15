import { z } from 'zod';
import { ATTENDANCE_TYPES } from '../../../shared/constants/index.js';

export const attendanceMarkSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  address: z.string().max(500).optional(),
  device: z.string().max(100).optional(),
  browser: z.string().max(100).optional(),
});

export const attendanceHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  userId: z.string().uuid().optional(),
  type: z
    .enum([
      ATTENDANCE_TYPES.CHECK_IN,
      ATTENDANCE_TYPES.CHECK_OUT,
      ATTENDANCE_TYPES.LATE,
      ATTENDANCE_TYPES.ABSENT,
      ATTENDANCE_TYPES.LEAVE,
      ATTENDANCE_TYPES.HALF_DAY,
    ])
    .optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
});

export type AttendanceMarkBody = z.infer<typeof attendanceMarkSchema>;
export type AttendanceHistoryQuery = z.infer<typeof attendanceHistoryQuerySchema>;
