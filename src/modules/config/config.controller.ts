import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler.js';
import { successResponse } from '../../shared/responses/index.js';
import { getEnv } from '../../config/index.js';

export const getClientConfig = asyncHandler(async (_req: Request, res: Response) => {
  const env = getEnv();

  if (!env.SUPABASE_ANON_KEY) {
    res.status(200).json(
      successResponse(
        {
          supabaseUrl: env.SUPABASE_URL,
          supabaseAnonKey: '',
          realtimeEnabled: false,
        },
        'Client config retrieved (realtime disabled — add SUPABASE_ANON_KEY)',
      ),
    );
    return;
  }

  res.status(200).json(
    successResponse(
      {
        supabaseUrl: env.SUPABASE_URL,
        supabaseAnonKey: env.SUPABASE_ANON_KEY,
        realtimeEnabled: true,
      },
      'Client config retrieved',
    ),
  );
});
