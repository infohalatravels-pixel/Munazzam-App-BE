import type { Request, Response } from 'express';
import { asyncHandler } from '../../../shared/async-handler.js';
import { successResponse } from '../../../shared/responses/index.js';
import { usersService } from '../service/users.service.js';
import type {
  CreateUserBody,
  ListUsersQuery,
  UpdateUserBody,
  UserIdParam,
} from '../validator/users.validator.js';

export class UsersController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListUsersQuery;
    const result = await usersService.list(query, req.user!);
    res.status(200).json(successResponse(result, 'Users retrieved'));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as UserIdParam;
    const result = await usersService.getById(id, req.user!);
    res.status(200).json(successResponse(result, 'User retrieved'));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateUserBody;
    const result = await usersService.create(body, req.user!, req.ip);
    res.status(201).json(successResponse(result, 'User created'));
  });

  lookups = asyncHandler(async (req: Request, res: Response) => {
    const result = await usersService.getFormLookups(req.user!);
    res.status(200).json(successResponse(result, 'Form lookups retrieved'));
  });

  stats = asyncHandler(async (req: Request, res: Response) => {
    const result = await usersService.getStats(req.user!);
    res.status(200).json(successResponse(result, 'User stats retrieved'));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as UserIdParam;
    const body = req.body as UpdateUserBody;
    const result = await usersService.update(id, body, req.user!, req.ip);
    res.status(200).json(successResponse(result, 'User updated'));
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as UserIdParam;
    await usersService.remove(id, req.user!, req.ip);
    res.status(200).json(successResponse({ id }, 'User deleted'));
  });
}

export const usersController = new UsersController();
