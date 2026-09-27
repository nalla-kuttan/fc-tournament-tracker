import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFakeSupabase, MAX_ROWS, playedMatches } from './helpers/fake-supabase';

vi.mock('server-only', () => ({}));

let fake: ReturnType<typeof createFakeSupabase>;
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => fake.client,
}));

const PAST_CAP = MAX_ROWS + 250;

function registered(id: string, name: string) {
  return { id, name, base_team: `${name} FC` };
}

function instance(id: string, registeredId: string, tournamentId: string, name: string) {
  return { id, registered_player_id: registeredId, tournament_id: tournamentId, name, team: `${name} FC` };
}

function goalsFor(playerId: string, count: number, prefix = playerId) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-goal-${String(index).padStart(5, '0')}`,
    player_id: playerId,
    match_id: 'unused',
    minute: 10,
  }));
}

// Two registered players with one instance each, and more head-to-head
// matches than a single Supabase response can return.
function rivalryTables() {
  return {
    registered_player: [registered('ra', 'Alex'), registered('rb', 'Basil')],
    player: [instance('pa', 'ra', 't1', 'Alex'), instance('pb', 'rb', 't1', 'Basil')],
    match: playedMatches(PAST_CAP, { prefix: 'm', tournamentId: 't1', homeId: 'pa', awayId: 'pb', homeScore: 2, awayScore: 1 }),
    goal: [...goalsFor('pa', PAST_CAP * 2), ...goalsFor('pb', PAST_CAP)],
  };
}

describe('full-history analytics routes', () => {
  beforeEach(() => {
    fake = createFakeSupabase({ tables: rivalryTables() });
  });

  it('global analytics includes every played match, not just the first 1,000', async () => {
    const { GET } = await import('@/app/api/analytics/global/route');
    const body = await (await GET()).json();

    expect(body.all_matches).toHaveLength(PAST_CAP);
    const alex = body.career_stats.find((row: { registered_player_id: string }) => row.registered_player_id === 'ra');
    expect(alex).toMatchObject({ total_matches: PAST_CAP, wins: PAST_CAP, total_goals: PAST_CAP * 2 });
  });

  it('head-to-head counts every meeting and every goal', async () => {
    const { GET } = await import('@/app/api/analytics/h2h/route');
    const p1 = '00000000-0000-4000-8000-000000000001';
    const p2 = '00000000-0000-4000-8000-000000000002';
    const tables = rivalryTables();
    tables.registered_player = [registered(p1, 'Alex'), registered(p2, 'Basil')];
    tables.player = [instance('pa', p1, 't1', 'Alex'), instance('pb', p2, 't1', 'Basil')];
    fake = createFakeSupabase({ tables });

    const response = await GET(new Request(`http://test/api/analytics/h2h?p1=${p1}&p2=${p2}`));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ total_encounters: PAST_CAP, player1_wins: PAST_CAP, player1_goals: PAST_CAP * 2 });
    expect(body.player1_career.total_goals).toBe(PAST_CAP * 2);
    expect(body.player2_career.total_goals).toBe(PAST_CAP);
  });

  it('player stats cover the whole career', async () => {
    const { GET } = await import('@/app/api/players/[playerId]/stats/route');
    const response = await GET(new Request('http://test'), { params: Promise.resolve({ playerId: 'ra' }) });
    const body = await response.json();

    expect(body.matches).toHaveLength(PAST_CAP);
    expect(body.stats).toMatchObject({ total_matches: PAST_CAP, total_goals: PAST_CAP * 2 });
  });

  it('player stats report a failed query instead of showing an empty career', async () => {
    fake = createFakeSupabase({
      tables: rivalryTables(),
      failWhen: (query) => (query.table === 'goal' ? { message: 'connection reset' } : null),
    });
    const { GET } = await import('@/app/api/players/[playerId]/stats/route');
    const response = await GET(new Request('http://test'), { params: Promise.resolve({ playerId: 'ra' }) });

    expect(response.status).toBe(500);
  });

  it('hall of fame crowns winners whose matches fall beyond the first 1,000 rows', async () => {
    const early = playedMatches(MAX_ROWS, { prefix: 'early', tournamentId: 't1', homeId: 'pa', awayId: 'pb' });
    const late = playedMatches(3, { prefix: 'late', tournamentId: 't2', homeId: 'qb', awayId: 'qa', startDay: 30 });
    fake = createFakeSupabase({
      tables: {
        tournament: [
          { id: 't1', name: 'Spring League', format: 'league', status: 'completed', created_at: '2026-01-01T00:00:00Z' },
          { id: 't2', name: 'Summer League', format: 'league', status: 'completed', created_at: '2026-02-01T00:00:00Z' },
        ],
        player: [
          instance('pa', 'ra', 't1', 'Alex'), instance('pb', 'rb', 't1', 'Basil'),
          instance('qa', 'ra', 't2', 'Alex'), instance('qb', 'rb', 't2', 'Basil'),
        ],
        match: [...early, ...late],
      },
    });
    const { GET } = await import('@/app/api/analytics/hall-of-fame/route');
    const body = await (await GET()).json();

    const summer = body.find((entry: { tournament_id: string }) => entry.tournament_id === 't2');
    expect(summer).toMatchObject({ winner_name: 'Basil', stats: { played: 3, wins: 3 } });
  });
});

describe('AI fact builders', () => {
  beforeEach(() => {
    fake = createFakeSupabase({ tables: rivalryTables() });
  });

  it('global stat facts use the whole match history', async () => {
    const { getGlobalStatFacts } = await import('@/lib/ai-data');
    const facts = await getGlobalStatFacts();

    expect(facts.find((row) => row.registered_player_id === 'ra')).toMatchObject({
      total_matches: PAST_CAP,
      total_goals: PAST_CAP * 2,
    });
  });

  it('scout facts use the whole career', async () => {
    const { getPlayerScoutFacts } = await import('@/lib/ai-data');
    const { stats } = await getPlayerScoutFacts('rb');

    expect(stats).toMatchObject({ total_matches: PAST_CAP, losses: PAST_CAP, total_goals: PAST_CAP });
  });

  it('tournament summaries rank from every match but only send the latest 100', async () => {
    fake = createFakeSupabase({
      tables: {
        tournament: [{ id: 't1', name: 'Marathon League', format: 'league', status: 'active' }],
        player: [instance('pa', 'ra', 't1', 'Alex'), instance('pb', 'rb', 't1', 'Basil')],
        match: playedMatches(150, { prefix: 'm', tournamentId: 't1', homeId: 'pa', awayId: 'pb' }),
      },
    });
    const { getTournamentSummaryFacts } = await import('@/lib/ai-data');
    const facts = await getTournamentSummaryFacts('t1');

    expect(facts.standings[0]).toMatchObject({ player_id: 'pa', played: 150, points: 450 });
    expect(facts.matches).toHaveLength(100);
    expect(facts.matches[0].id).toBe('m-00149');
  });
});

describe('competitive data', () => {
  function competitiveTables() {
    return {
      ...rivalryTables(),
      season: [{ id: 's1', name: 'Season 1', status: 'active', created_at: '2026-01-01T00:00:00Z' }],
      tournament: [{ id: 't1', name: 'Spring League', format: 'league', status: 'active', season_id: 's1', created_at: '2026-01-01T00:00:00Z' }],
    };
  }

  it('loads every played match and player instance', async () => {
    const tables = competitiveTables();
    tables.player = [
      ...tables.player,
      ...Array.from({ length: MAX_ROWS }, (_, index) => instance(`extra-${String(index).padStart(5, '0')}`, 'rb', 't1', 'Basil')),
    ];
    fake = createFakeSupabase({ tables });
    const { getCompetitiveData } = await import('@/lib/competitive-data');
    const data = await getCompetitiveData();

    expect(data.matches).toHaveLength(PAST_CAP);
    expect(data.playerInstances).toHaveLength(MAX_ROWS + 2);
    expect(data.seasons.map((season) => season.id)).toContain('s1');
  });

  it('falls back to the pre-season schema only when a column is missing', async () => {
    fake = createFakeSupabase({
      tables: competitiveTables(),
      failWhen: (query) => (query.columns.includes('season_id')
        ? { code: '42703', message: 'column tournament.season_id does not exist' }
        : null),
    });
    const { getCompetitiveData } = await import('@/lib/competitive-data');
    const data = await getCompetitiveData();

    expect(data.tournaments).toHaveLength(1);
    expect(data.matches).toHaveLength(PAST_CAP);
  });

  it('treats a missing season table as no saved seasons', async () => {
    fake = createFakeSupabase({
      tables: competitiveTables(),
      failWhen: (query) => (query.table === 'season' ? { code: 'PGRST205', message: 'table not found' } : null),
    });
    const { getCompetitiveData } = await import('@/lib/competitive-data');
    const data = await getCompetitiveData();

    expect(data.seasons.map((season) => season.id)).not.toContain('s1');
    expect(data.matches).toHaveLength(PAST_CAP);
  });

  it.each([
    ['match', 'played matches'],
    ['tournament', 'tournaments'],
    ['season', 'seasons'],
    ['player', 'player instances'],
    ['registered_player', 'registered players'],
  ])('reports a failed %s query instead of returning empty %s', async (table) => {
    fake = createFakeSupabase({
      tables: competitiveTables(),
      failWhen: (query) => (query.table === table ? { code: '57014', message: 'statement timeout' } : null),
    });
    const { getCompetitiveData } = await import('@/lib/competitive-data');

    await expect(getCompetitiveData()).rejects.toMatchObject({ code: '57014' });
  });

  it('reports a failed fallback query', async () => {
    fake = createFakeSupabase({
      tables: competitiveTables(),
      failWhen: (query) => {
        if (query.table !== 'match') return null;
        return query.columns.includes('season_id')
          ? { code: '42703', message: 'column tournament.season_id does not exist' }
          : { code: '57014', message: 'statement timeout' };
      },
    });
    const { getCompetitiveData } = await import('@/lib/competitive-data');

    await expect(getCompetitiveData()).rejects.toMatchObject({ code: '57014' });
  });

  it('surfaces errors through the records route', async () => {
    fake = createFakeSupabase({
      tables: competitiveTables(),
      failWhen: (query) => (query.table === 'match' ? { code: '57014', message: 'statement timeout' } : null),
    });
    const { GET } = await import('@/app/api/competitive/records/route');
    const response = await GET(new Request('http://test/api/competitive/records'));

    expect(response.status).toBe(500);
  });
});
