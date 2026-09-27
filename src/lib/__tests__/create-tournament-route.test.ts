import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const calls: Array<{ op: string; table?: string; args?: unknown }> = [];
let tournamentRpcError: { message: string } | null = null;

function adminClient() {
  return {
    rpc: async (fn: string, args: unknown) => {
      calls.push({ op: 'rpc', table: fn, args });
      if (fn === 'consume_rate_limit') return { data: { allowed: true, retry_after_seconds: 60 }, error: null };
      return tournamentRpcError ? { data: null, error: tournamentRpcError } : { data: { id: 'tournament-1' }, error: null };
    },
    from: (table: string) => ({
      insert: (row: unknown) => {
        calls.push({ op: 'insert', table, args: row });
        return { select: () => ({ single: async () => ({ data: { id: 'season-new' }, error: null }) }) };
      },
      delete: () => ({
        eq: async (column: string, value: unknown) => {
          calls.push({ op: 'delete', table, args: { [column]: value } });
          return { error: null };
        },
      }),
    }),
  };
}

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: () => adminClient(),
  createServerClient: () => adminClient(),
}));

const body = {
  name: 'Season 25',
  format: 'league',
  pin: '4242',
  playerSelections: [{ registered_player_id: '00000000-0000-4000-8000-000000000001', team: 'Barcelona' }],
};

function request(payload: unknown) {
  return new Request('http://test/api/tournaments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

const tournamentRpc = () => calls.find((call) => call.op === 'rpc' && call.table === 'create_tournament_atomic');

beforeEach(() => {
  calls.length = 0;
  tournamentRpcError = null;
});

describe('create tournament', () => {
  it('starts a named season and files the tournament under it', async () => {
    const { POST } = await import('@/app/api/tournaments/route');
    const response = await POST(request({ ...body, new_season_name: 'Season 25' }));

    expect(response.status).toBe(201);
    expect(calls.find((call) => call.op === 'insert')).toMatchObject({ table: 'season', args: { name: 'Season 25', status: 'active' } });
    expect(tournamentRpc()?.args).toMatchObject({ p_season_id: 'season-new' });
  });

  it('removes the new season if the tournament cannot be created', async () => {
    tournamentRpcError = { message: 'Tournament name must be between 1 and 100 characters' };
    const { POST } = await import('@/app/api/tournaments/route');
    const response = await POST(request({ ...body, new_season_name: 'Season 25' }));

    expect(response.status).toBe(500);
    expect(calls.find((call) => call.op === 'delete')).toMatchObject({ table: 'season', args: { id: 'season-new' } });
  });

  it('joins an existing season without creating one', async () => {
    const { POST } = await import('@/app/api/tournaments/route');
    const seasonId = '00000000-0000-4000-8000-0000000000aa';
    const response = await POST(request({ ...body, season_id: seasonId }));

    expect(response.status).toBe(201);
    expect(calls.some((call) => call.op === 'insert')).toBe(false);
    expect(tournamentRpc()?.args).toMatchObject({ p_season_id: seasonId });
  });

  it('rejects asking for both an existing and a new season', async () => {
    const { POST } = await import('@/app/api/tournaments/route');
    const response = await POST(request({ ...body, season_id: '00000000-0000-4000-8000-0000000000aa', new_season_name: 'Season 25' }));

    expect(response.status).toBe(400);
    expect(tournamentRpc()).toBeUndefined();
  });
});
