import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError } from '../shared/errors/index.js';

type RequestPart = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      next(new ValidationError('Validation failed', result.error.flatten()));
      return;
    }

    req[part] = result.data;
    next();
  };
}
