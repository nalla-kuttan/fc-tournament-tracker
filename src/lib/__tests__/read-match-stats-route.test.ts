import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { hashPin } from '../auth';
import { createFakeSupabase } from './helpers/fake-supabase';

vi.mock('server-only', () => ({}));

const readImageJson = vi.fn();
vi.mock('@/lib/ai', () => ({ readImageJson: (...args: unknown[]) => readImageJson(...args) }));

let fake: ReturnType<typeof createFakeSupabase>;
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => fake.client,
  // No database rate limiter in tests; the route falls back to the in-memory one.
  createAdminClient: () => { throw new Error('not configured'); },
}));

const MATCH_ID = '00000000-0000-4000-8000-00000000000a';
const PIN = '4242';
const image = { mimeType: 'image/jpeg', data: 'A'.repeat(400) };

function request(body: unknown) {
  return new Request('http://test/api/ai/read-match-stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

let pinHash = '';
beforeAll(async () => {
  pinHash = await hashPin(PIN);
});

beforeEach(() => {
  readImageJson.mockReset();
  fake = createFakeSupabase({
    tables: {
      match: [{ id: MATCH_ID, tournament_id: 't1', home_player: { team: 'Tottenham' }, away_player: { team: 'Barcelona' } }],
      tournament: [{ id: 't1', pin: pinHash }],
    },
  });
});

describe('read match stats from photo', () => {
  it('returns suggested values mapped to the fixture sides', async () => {
    readImageJson.mockResolvedValue({
      is_match_stats_screen: true,
      left: { team_name: 'Barcelona', goals: 2, possession: 55, xg: 1.9, tackles: 12, interceptions: 8 },
      right: { team_name: 'Spurs Tottenham', goals: 2, possession: 45, xg: 1.1, tackles: 15, interceptions: 10 },
      player_of_the_match: { side: 'right', rating: 8.7 },
    });
    const { POST } = await import('@/app/api/ai/read-match-stats/route');

    const response = await POST(request({ matchId: MATCH_ID, pin: PIN, image }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.sidesUncertain).toBe(false);
    expect(body.sheet).toMatchObject({ homeXg: '1.1', awayXg: '1.9', homePossession: '45', motmSide: 'home', motmRating: '8.7' });
    expect(readImageJson).toHaveBeenCalledWith(image, expect.any(String), expect.any(Object));
  });

  it('refuses a wrong PIN without calling the AI', async () => {
    const { POST } = await import('@/app/api/ai/read-match-stats/route');

    const response = await POST(request({ matchId: MATCH_ID, pin: '0000', image }));

    expect(response.status).toBe(403);
    expect(readImageJson).not.toHaveBeenCalled();
  });

  it('rejects files that are not images', async () => {
    const { POST } = await import('@/app/api/ai/read-match-stats/route');

    const response = await POST(request({ matchId: MATCH_ID, pin: PIN, image: { ...image, mimeType: 'application/pdf' } }));

    expect(response.status).toBe(400);
    expect(readImageJson).not.toHaveBeenCalled();
  });

  it('explains an unreadable photo instead of filling in guesses', async () => {
    readImageJson.mockResolvedValue({ unexpected: true });
    const { POST } = await import('@/app/api/ai/read-match-stats/route');

    const response = await POST(request({ matchId: MATCH_ID, pin: PIN, image }));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.code).toBe('AI_UNREADABLE');
  });
});
