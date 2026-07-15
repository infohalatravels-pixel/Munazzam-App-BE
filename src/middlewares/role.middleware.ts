import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../shared/constants/index.js';
import { ForbiddenError, UnauthorizedError } from '../shared/errors/index.js';

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
}
