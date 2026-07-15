import type { Request, Response } from 'express';
import { asyncHandler } from '../../../shared/async-handler.js';
import { successResponse } from '../../../shared/responses/index.js';
import { attendanceService } from '../service/attendance.service.js';
import type {
  AttendanceHistoryQuery,
  AttendanceMarkBody,
} from '../validator/attendance.validator.js';

export class AttendanceController {
  checkIn = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as AttendanceMarkBody;
    const result = await attendanceService.checkIn(req.user!.id, body, req.ip);
    res.status(201).json(successResponse(result, 'Checked in successfully'));
  });

  checkOut = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as AttendanceMarkBody;
    const result = await attendanceService.checkOut(req.user!.id, body, req.ip);
    res.status(201).json(successResponse(result, 'Checked out successfully'));
  });

  history = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as AttendanceHistoryQuery;
    const result = await attendanceService.getHistory(query, req.user!);
    res.status(200).json(successResponse(result, 'Attendance history retrieved'));
  });

  daily = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as AttendanceHistoryQuery;
    const result = await attendanceService.getDailyHistory(query, req.user!);
    res.status(200).json(successResponse(result, 'Daily attendance retrieved'));
  });

  today = asyncHandler(async (req: Request, res: Response) => {
    const result = await attendanceService.getToday(req.user!.id);
    res.status(200).json(successResponse(result, 'Today attendance retrieved'));
  });
}

export const attendanceController = new AttendanceController();
