'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export interface LiveScore {
  matchId: string;
  home: number;
  away: number;
  status: 'live' | 'ended';
  startedAt: number;
  // Which side scored last, for the TV's goal flash.
  lastGoal: 'home' | 'away' | null;
  // Changes on every update so receivers can ignore stale repeats.
  version: number;
}

// Live scores travel phone → TV over a Supabase broadcast channel. Nothing is
// stored: the scoring phone answers "sync" requests from screens that join
// late, and the real result is still saved through the normal form.
export function useLiveScoreChannel(tournamentId: string, options: { onScore?: (score: LiveScore) => void; source?: () => LiveScore | null } = {}) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [connected, setConnected] = useState(false);
  const onScore = useRef(options.onScore);
  const source = useRef(options.source);
  useEffect(() => {
    onScore.current = options.onScore;
    source.current = options.source;
  });

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`live-score:${tournamentId}`, { config: { broadcast: { self: false } } });
    channel
      .on('broadcast', { event: 'score' }, ({ payload }) => onScore.current?.(payload as LiveScore))
      .on('broadcast', { event: 'sync' }, () => {
        const current = source.current?.();
        if (current) void channel.send({ type: 'broadcast', event: 'score', payload: current });
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
        // Ask whoever is scoring for the current state.
        if (status === 'SUBSCRIBED' && onScore.current) void channel.send({ type: 'broadcast', event: 'sync', payload: {} });
      });
    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  const send = useCallback((score: LiveScore) => {
    void channelRef.current?.send({ type: 'broadcast', event: 'score', payload: score });
  }, []);

  return { connected, send };
}
