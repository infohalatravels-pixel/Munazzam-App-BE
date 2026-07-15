import type { Request, Response } from 'express';
import { asyncHandler } from '../../../shared/async-handler.js';
import { successResponse } from '../../../shared/responses/index.js';
import { analyticsService } from '../service/analytics.service.js';

export class AnalyticsController {
  dashboard = asyncHandler(async (req: Request, res: Response) => {
    const result = await analyticsService.getDashboard(req.user!);
    res.status(200).json(successResponse(result, 'Dashboard data retrieved'));
  });
}

export const analyticsController = new AnalyticsController();
