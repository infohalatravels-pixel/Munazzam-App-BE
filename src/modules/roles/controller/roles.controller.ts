import type { Request, Response } from 'express';
import { asyncHandler } from '../../../shared/async-handler.js';
import { successResponse } from '../../../shared/responses/index.js';
import { rolesService } from '../service/roles.service.js';

export class RolesController {
  list = asyncHandler(async (_req: Request, res: Response) => {
    const result = await rolesService.list();
    res.status(200).json(successResponse(result, 'Roles retrieved'));
  });
}

export const rolesController = new RolesController();
