import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { getEnv } from '../config/index.js';

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    const env = getEnv();
    client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      // Vercel Node has no global WebSocket; supabase-js requires a transport at init
      realtime: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transport: WebSocket as any,
      },
    });
  }
  return client;
}

/** Lazy proxy so importing this module does not require env vars until first DB call. */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getClient() as object, prop, receiver);
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(getClient()) : value;
  },
});
