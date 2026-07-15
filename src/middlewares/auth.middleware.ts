import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../shared/errors/index.js';
import { verifyAccessToken } from '../shared/jwt/jwt.service.js';
import { authRepository } from '../modules/auth/repository/auth.repository.js';
import type { UserRole } from '../shared/constants/index.js';

const SESSION_EXPIRED_MESSAGE = 'Your session is expired. Please login again.';

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    next(new UnauthorizedError('Access token required'));
    return;
  }

  const token = header.slice(7);

  try {
    const payload = verifyAccessToken(token);
    const user = await authRepository.findUserById(payload.sub);

    if (!user || !user.is_active) {
      next(new UnauthorizedError(SESSION_EXPIRED_MESSAGE, 'SESSION_EXPIRED'));
      return;
    }

    const roleName = user.roles?.name as UserRole | undefined;
    if (!roleName) {
      next(new UnauthorizedError(SESSION_EXPIRED_MESSAGE, 'SESSION_EXPIRED'));
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: roleName,
    };
    next();
  } catch (error) {
    next(error);
  }
}
