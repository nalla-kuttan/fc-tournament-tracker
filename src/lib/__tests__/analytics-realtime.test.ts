import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ANALYTICS_REALTIME_TABLES,
  createBatchedAnalyticsRevalidator,
  isAnalyticsDataKey,
  subscribeToAnalyticsChanges,
} from '../analytics-realtime';

describe('analytics realtime synchronization', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('revalidates only cache keys that feed analytics views', () => {
    expect(isAnalyticsDataKey('/api/analytics/global')).toBe(true);
    expect(isAnalyticsDataKey('/api/analytics/h2h?p1=one&p2=two')).toBe(true);
    expect(isAnalyticsDataKey('/api/analytics/league/tournament-one')).toBe(true);
    expect(isAnalyticsDataKey('/api/tournaments')).toBe(true);
    expect(isAnalyticsDataKey('/api/players')).toBe(false);
    expect(isAnalyticsDataKey('/api/music')).toBe(false);
    expect(isAnalyticsDataKey(['api', 'analytics'])).toBe(false);
  });

  it('batches a burst of database changes into one revalidation', () => {
    const revalidate = vi.fn();
    const revalidator = createBatchedAnalyticsRevalidator(revalidate, 250);

    revalidator.schedule();
    revalidator.schedule();
    revalidator.schedule();

    expect(revalidate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(250);
    expect(revalidate).toHaveBeenCalledTimes(1);

    revalidator.schedule();
    revalidator.dispose();
    vi.runAllTimers();
    expect(revalidate).toHaveBeenCalledTimes(1);
  });

  it('subscribes to every table that can change analytics and removes the channel on cleanup', () => {
    const handlers: Array<{
      type: string;
      filter: { event: string; schema: string; table: string };
      callback: () => void;
    }> = [];
    const channel = {
      on: vi.fn((
        type: 'postgres_changes',
        filter: { event: '*'; schema: 'public'; table: string },
        callback: () => void
      ) => {
        handlers.push({ type, filter, callback });
        return channel;
      }),
      subscribe: vi.fn(() => channel),
    };
    const client = {
      channel: vi.fn(() => channel),
      removeChannel: vi.fn(),
    };
    const onChange = vi.fn();

    const cleanup = subscribeToAnalyticsChanges(client, onChange);

    expect(handlers.map(({ filter }) => filter.table)).toEqual(ANALYTICS_REALTIME_TABLES);
    expect(handlers.every(({ type, filter }) => (
      type === 'postgres_changes' && filter.event === '*' && filter.schema === 'public'
    ))).toBe(true);
    expect(channel.subscribe).toHaveBeenCalledTimes(1);

    handlers[0].callback();
    expect(onChange).toHaveBeenCalledTimes(1);

    cleanup();
    expect(client.removeChannel).toHaveBeenCalledWith(channel);
  });
});
