import type { Request, Response } from 'express';
import type { z } from 'zod';
import { asyncHandler } from '../../../shared/async-handler.js';
import { successResponse } from '../../../shared/responses/index.js';
import { accountsService } from '../service/accounts.service.js';
import type { CreateAccountInput, UpdateAccountInput } from '../types/accounts.types.js';
import type { accountIdParamSchema } from '../validator/accounts.validator.js';

type AccountIdParam = z.infer<typeof accountIdParamSchema>;

export class AccountsController {
  list = asyncHandler(async (_req: Request, res: Response) => {
    const accounts = await accountsService.list();
    res.status(200).json(successResponse(accounts, 'Accounts retrieved'));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as AccountIdParam;
    const account = await accountsService.getById(id);
    res.status(200).json(successResponse(account, 'Account retrieved'));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateAccountInput;
    const account = await accountsService.create(body);
    res.status(201).json(successResponse(account, 'Account created'));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as AccountIdParam;
    const body = req.body as UpdateAccountInput;
    const account = await accountsService.update(id, body);
    res.status(200).json(successResponse(account, 'Account updated'));
  });
}

export const accountsController = new AccountsController();
