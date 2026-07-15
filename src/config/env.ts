import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  API_PREFIX: z.string().default('/api/v1'),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('2d'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().default(''),
  SUPABASE_STORAGE_BUCKET: z.string().default('munazzam-uploads'),

  // Comma-separated list of allowed frontend origins (e.g. local + Vercel)
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),

  DEFAULT_OFFICE_RADIUS_METERS: z.coerce.number().int().positive().default(200),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    console.error('Invalid environment configuration:', formatted);
    const missing = Object.entries(formatted)
      .map(([key, messages]) => `${key}: ${(messages ?? []).join(', ')}`)
      .join('; ');
    throw new Error(`Environment validation failed — ${missing}`);
  }

  return result.data;
}

export function getEnv(): Env {
  cachedEnv ??= loadEnv();
  return cachedEnv;
}
