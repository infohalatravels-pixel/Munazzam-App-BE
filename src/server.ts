import 'dotenv/config';
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

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: getEnv().CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(
  rateLimit({
    windowMs: getEnv().RATE_LIMIT_WINDOW_MS,
    max: getEnv().RATE_LIMIT_MAX_REQUESTS,
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
        service: 'nasaq-api',
        environment: getEnv().NODE_ENV,
      },
      'Nasaq API is running',
    ),
  );
});

app.use(getEnv().API_PREFIX, apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(getEnv().PORT, () => {
  logger.info(`Nasaq API listening on port ${getEnv().PORT}`);
});

export { app };
