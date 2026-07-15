import 'dotenv/config';
import { app } from './app.js';
import { getEnv } from './config/index.js';
import { logger } from './shared/logger/index.js';

const isVercel = Boolean(process.env.VERCEL);

// On Vercel the app is exported via /api — do not call listen()
if (!isVercel) {
  const env = getEnv();
  app.listen(env.PORT, () => {
    logger.info(`Munazzam API listening on port ${env.PORT}`);
  });
}

export { app };
