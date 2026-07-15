import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../shared/errors/index.js';
import { errorResponse } from '../shared/responses/index.js';
import { logger } from '../shared/logger/index.js';
import { getEnv } from '../config/index.js';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json(errorResponse('Route not found', 'NOT_FOUND'));
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    logger.warn(err.message, {
      code: err.code,
      statusCode: err.statusCode,
      path: req.path,
      requestId: req.requestId,
    });

    res.status(err.statusCode).json(errorResponse(err.message, err.code, err.details));
    return;
  }

  logger.error('Unhandled error', {
    error: err,
    path: req.path,
    requestId: req.requestId,
  });

  const message = getEnv().NODE_ENV === 'production' ? 'Internal server error' : String(err);
  res.status(500).json(errorResponse(message, 'INTERNAL_ERROR'));
}
