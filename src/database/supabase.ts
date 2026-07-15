import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../config/index.js';

export const supabase = createClient(getEnv().SUPABASE_URL, getEnv().SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
