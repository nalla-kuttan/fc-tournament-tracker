export const ANALYTICS_REALTIME_TABLES = [
  'goal',
  'match',
  'player',
  'registered_player',
  'tournament',
] as const;

interface AnalyticsRealtimeChannel {
  on(
    type: 'postgres_changes',
    filter: { event: '*'; schema: 'public'; table: string },
    callback: () => void
  ): AnalyticsRealtimeChannel;
  subscribe(): unknown;
}

interface AnalyticsRealtimeClient<TChannel extends AnalyticsRealtimeChannel> {
  channel(name: string): TChannel;
  removeChannel(channel: TChannel): unknown;
}

export function isAnalyticsDataKey(key: unknown) {
  return typeof key === 'string'
    && (key.startsWith('/api/analytics/') || key === '/api/tournaments');
}

export function createBatchedAnalyticsRevalidator(
  revalidate: () => void,
  delayMs = 250
) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return {
    schedule() {
      if (timeoutId !== null) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        revalidate();
      }, delayMs);
    },
    dispose() {
      if (timeoutId === null) return;
      clearTimeout(timeoutId);
      timeoutId = null;
    },
  };
}

export function subscribeToAnalyticsChanges<TChannel extends AnalyticsRealtimeChannel>(
  client: AnalyticsRealtimeClient<TChannel>,
  onChange: () => void
) {
  const channel = client.channel('analytics-data-changes');

  for (const table of ANALYTICS_REALTIME_TABLES) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      onChange
    );
  }

  channel.subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
