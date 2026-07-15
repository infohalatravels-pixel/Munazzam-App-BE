import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const channel = supabase.channel('nasaq-server-broadcast');

channel.subscribe(async (status) => {
  if (status !== 'SUBSCRIBED') return;

  const result = await channel.send({
    type: 'broadcast',
    event: 'ping',
    payload: { ok: true },
  });

  console.log('Broadcast channel ready:', result);
  await supabase.removeChannel(channel);
  process.exit(0);
});
