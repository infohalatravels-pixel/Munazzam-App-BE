import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { getEnv } from './config/index.js';
import { apiRouter } from './routes/index.js';
import {
  errorHandler,
  notFoundHandler,
  requestIdMiddleware,
} from './middlewares/index.js';
import { logger } from './shared/logger/index.js';
import { successResponse } from './shared/responses/index.js';

function parseCorsOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createApp() {
  const env = getEnv();
  const app = express();
  const allowedOrigins = parseCorsOrigins(env.CORS_ORIGIN);

  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Allow non-browser clients (no Origin header) and configured frontend URLs
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
          return;
        }
        callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
    }),
  );
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX_REQUESTS,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(requestIdMiddleware);
  app.use(
    morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    }),
  );

  app.get('/health', (_req, res) => {
    res.json(
      successResponse(
        {
          status: 'healthy',
          service: 'munazzam-api',
          environment: env.NODE_ENV,
        },
        'Munazzam API is running',
      ),
    );
  });

  app.use(env.API_PREFIX, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
