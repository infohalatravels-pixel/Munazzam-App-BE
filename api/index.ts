import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Express } from 'express';

let cachedApp: Express | null = null;
let bootPromise: Promise<Express> | null = null;

/**
 * Disable Vercel's body parser so Express can read the raw request stream.
 * Pre-parsed bodies leave express.json() with an empty stream → empty login body → errors.
 */
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getApp(): Promise<Express> {
  if (cachedApp) return cachedApp;
  bootPromise ??= import('../src/app.js').then((mod) => {
    cachedApp = mod.createApp();
    return cachedApp;
  });
  return bootPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error('[munazzam-api] bootstrap failed:', error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      error: 'FUNCTION_BOOTSTRAP_FAILED',
      message,
      hint:
        'Set required backend env vars in Vercel → Settings → Environment Variables (Production), then Redeploy.',
    });
  }
}
