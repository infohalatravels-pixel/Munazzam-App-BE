import type { NextFunction, Request, Response } from 'express';
import { generateRequestId } from '../utils/index.js';

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.requestId = generateRequestId();
  next();
}
