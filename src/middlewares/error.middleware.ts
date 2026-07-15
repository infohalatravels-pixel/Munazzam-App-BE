import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../shared/errors/index.js';
import { errorResponse } from '../shared/responses/index.js';
import { logger } from '../shared/logger/index.js';

function isAppError(err: unknown): err is AppError {
  if (err instanceof AppError) return true;
  if (typeof err !== 'object' || err === null) return false;
  const candidate = err as Record<string, unknown>;
  return (
    typeof candidate.statusCode === 'number' &&
    typeof candidate.code === 'string' &&
    typeof candidate.message === 'string' &&
    candidate.isOperational === true
  );
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json(errorResponse('Route not found', 'NOT_FOUND'));
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (isAppError(err)) {
    logger.warn(err.message, {
      code: err.code,
      statusCode: err.statusCode,
      path: req.path,
      requestId: req.requestId,
      details: err.details,
    });

    res.status(err.statusCode).json(errorResponse(err.message, err.code, err.details));
    return;
  }

  const message = err instanceof Error ? err.message : String(err);

  logger.error('Unhandled error', {
    error: message,
    stack: err instanceof Error ? err.stack : undefined,
    path: req.path,
    requestId: req.requestId,
  });

  // Include message so Vercel/production login failures are debuggable
  res.status(500).json(errorResponse(message || 'Internal server error', 'INTERNAL_ERROR'));
}
