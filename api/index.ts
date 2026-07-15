import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Express } from 'express';

let cachedApp: Express | null = null;

function formatEnvError(error: unknown): { message: string; details?: unknown } {
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: String(error) };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!cachedApp) {
      // Load dotenv only when available; Vercel injects env vars directly
      try {
        await import('dotenv/config');
      } catch {
        // ignore
      }
      const { createApp } = await import('../src/app.js');
      cachedApp = createApp();
    }

    return cachedApp(req, res);
  } catch (error) {
    console.error('[munazzam-api] bootstrap failed:', error);
    const formatted = formatEnvError(error);
    res.status(500).json({
      success: false,
      error: 'FUNCTION_BOOTSTRAP_FAILED',
      message: formatted.message,
      hint:
        'Set all required backend env vars in Vercel → Settings → Environment Variables (Production), then Redeploy. Required: JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CORS_ORIGIN.',
    });
  }
}
