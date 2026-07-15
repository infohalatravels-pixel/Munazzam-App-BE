import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../database/supabase.js';

let broadcastChannel: RealtimeChannel | null = null;
let subscribePromise: Promise<RealtimeChannel> | null = null;

async function getBroadcastChannel(): Promise<RealtimeChannel> {
  if (broadcastChannel) return broadcastChannel;

  subscribePromise ??= new Promise<RealtimeChannel>((resolve, reject) => {
    const channel = supabase.channel('nasaq-server-broadcast');

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        broadcastChannel = channel;
        resolve(channel);
      }

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        reject(new Error(`Realtime broadcast channel failed: ${status}`));
      }
    });
  });

  return subscribePromise;
}

export async function broadcastTableChange(table: 'attendance' | 'users'): Promise<void> {
  try {
    const channel = await getBroadcastChannel();
    await channel.send({
      type: 'broadcast',
      event: 'db_change',
      payload: { table },
    });
  } catch {
    // Realtime broadcast is best-effort; postgres_changes remains primary on clients.
  }
}
