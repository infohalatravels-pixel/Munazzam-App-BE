import type { Request, Response } from 'express';
import { asyncHandler } from '../../../shared/async-handler.js';
import { successResponse } from '../../../shared/responses/index.js';
import { announcementsService } from '../service/announcements.service.js';

export class AnnouncementsController {
  list = asyncHandler(async (_req: Request, res: Response) => {
    const announcements = await announcementsService.listActive();
    res.status(200).json(successResponse(announcements, 'Announcements retrieved'));
  });
}

export const announcementsController = new AnnouncementsController();
