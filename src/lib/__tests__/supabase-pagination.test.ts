import { describe, expect, it, vi } from 'vitest';
import { fetchAllRows } from '../supabase/pagination';

describe('Supabase pagination', () => {
  it('fetches rows beyond the 1,000-row response limit', async () => {
    const source = Array.from({ length: 1005 }, (_, index) => ({ id: `goal-${index + 1}` }));
    const fetchPage = vi.fn(async (from: number, to: number) => ({
      data: source.slice(from, to + 1),
      error: null,
    }));

    const result = await fetchAllRows(fetchPage);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1005);
    expect(result.data?.at(-1)).toEqual({ id: 'goal-1005' });
    expect(fetchPage.mock.calls).toEqual([[0, 999], [1000, 1999]]);
  });
});
