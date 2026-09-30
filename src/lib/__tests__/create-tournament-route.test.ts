import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const calls: Array<{ op: string; table?: string; args?: unknown }> = [];
let tournamentRpcError: { message: string } | null = null;
// The newest existing tournament, whose PIN a new one reuses.
let previousTournament: { id: string; pin: string } | null = null;

function adminClient() {
  return {
    rpc: async (fn: string, args: unknown) => {
      calls.push({ op: 'rpc', table: fn, args });
      if (fn === 'consume_rate_limit') return { data: { allowed: true, retry_after_seconds: 60 }, error: null };
      return tournamentRpcError ? { data: null, error: tournamentRpcError } : { data: { id: 'tournament-1' }, error: null };
    },
    from: (table: string) => ({
      select: () => ({
        order: () => ({
          limit: () => ({
            maybeSingle: async () => {
              calls.push({ op: 'select', table });
              return { data: previousTournament, error: null };
            },
          }),
        }),
      }),
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
  previousTournament = { id: 'season-24', pin: '$2a$10$previouspreviouspreviousprevioushash' };
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

  it('reuses the previous tournament\'s PIN when none is given', async () => {
    const { POST } = await import('@/app/api/tournaments/route');
    const response = await POST(request({ ...body, pin: undefined }));

    expect(response.status).toBe(201);
    expect(tournamentRpc()?.args).toMatchObject({ p_pin_hash: previousTournament!.pin });
    expect(await response.json()).toMatchObject({ id: 'tournament-1', pin_from: 'season-24' });
  });

  it('hashes a new PIN when one is given, without reading the old one', async () => {
    const { POST } = await import('@/app/api/tournaments/route');
    const response = await POST(request(body));

    expect(response.status).toBe(201);
    const hash = (tournamentRpc()?.args as { p_pin_hash: string }).p_pin_hash;
    expect(hash).not.toBe(previousTournament!.pin);
    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(calls.some((call) => call.op === 'select' && call.table === 'tournament')).toBe(false);
  });

  it('asks for a PIN when creating the very first tournament', async () => {
    previousTournament = null;
    const { POST } = await import('@/app/api/tournaments/route');
    const response = await POST(request({ ...body, pin: undefined }));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'PIN_REQUIRED' });
    expect(tournamentRpc()).toBeUndefined();
  });
});
