import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { attendanceController } from '../controller/attendance.controller.js';
import {
  attendanceHistoryQuerySchema,
  attendanceMarkSchema,
} from '../validator/attendance.validator.js';

export const attendanceRouter = Router();

attendanceRouter.use(authenticate);

attendanceRouter.get('/today', attendanceController.today);
attendanceRouter.post('/check-in', validate(attendanceMarkSchema), attendanceController.checkIn);
attendanceRouter.post('/check-out', validate(attendanceMarkSchema), attendanceController.checkOut);
attendanceRouter.get(
  '/history',
  validate(attendanceHistoryQuerySchema, 'query'),
  attendanceController.history,
);
attendanceRouter.get(
  '/daily',
  validate(attendanceHistoryQuerySchema, 'query'),
  attendanceController.daily,
);
