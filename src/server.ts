import 'dotenv/config';
import { createApp } from './app.js';
import { getEnv } from './config/index.js';
import { logger } from './shared/logger/index.js';

const isVercel = Boolean(process.env.VERCEL);

if (!isVercel) {
  const app = createApp();
  const env = getEnv();
  app.listen(env.PORT, () => {
    logger.info(`Munazzam API listening on port ${env.PORT}`);
  });
}
