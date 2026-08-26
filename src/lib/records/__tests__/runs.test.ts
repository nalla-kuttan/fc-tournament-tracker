import { describe, expect, it } from 'vitest';
import { buildRecordContext } from '../context';
import { calculateRunRecords } from '../runs';
import type { Match, Player, RegisteredPlayer, Tournament } from '@/lib/types';

const registeredPlayers: RegisteredPlayer[] = [
  { id: 'rp-a', name: 'Alex', base_team: 'Chelsea', created_at: '2026-01-01T00:00:00Z' },
  { id: 'rp-b', name: 'Ruban', base_team: 'Liverpool', created_at: '2026-01-01T00:00:00Z' },
];
const playerInstances: Player[] = [
  { id: 'p-a1', tournament_id: 't1', registered_player_id: 'rp-a', name: 'Alex', team: 'Chelsea', seed: 1, created_at: '2026-01-01T00:00:00Z' },
  { id: 'p-b1', tournament_id: 't1', registered_player_id: 'rp-b', name: 'Ruban', team: 'Liverpool', seed: 2, created_at: '2026-01-01T00:00:00Z' },
  { id: 'p-a2', tournament_id: 't2', registered_player_id: 'rp-a', name: 'Alex', team: 'Spain', seed: 1, created_at: '2026-02-01T00:00:00Z' },
  { id: 'p-b2', tournament_id: 't2', registered_player_id: 'rp-b', name: 'Ruban', team: 'France', seed: 2, created_at: '2026-02-01T00:00:00Z' },
];
const tournaments: Tournament[] = [
  { id: 't1', name: 'Season 1', format: 'league', pin: '', status: 'completed', season_id: 's1', created_at: '2026-01-01T00:00:00Z' },
  { id: 't2', name: 'Season 2', format: 'league', pin: '', status: 'completed', season_id: 's2', created_at: '2026-02-01T00:00:00Z' },
];
function match(number: number, homeScore: number, awayScore: number, motm: 'alex' | 'ruban' | null, tournamentId = number <= 8 ? 't1' : 't2'): Match {
  const suffix = tournamentId === 't1' ? '1' : '2';
  const homeId = `p-a${suffix}`;
  const awayId = `p-b${suffix}`;
  return { id: `m${number}`, tournament_id: tournamentId, season_id: tournamentId === 't1' ? 's1' : 's2', home_player_id: homeId, away_player_id: awayId, home_score: homeScore, away_score: awayScore, round_number: number, match_number: number, stage: null, is_played: true, is_bye: false, stats: motm ? { motm_player_id: motm === 'alex' ? homeId : awayId } : {}, match_order: number, played_at: `2026-01-${String(number).padStart(2, '0')}T12:00:00Z`, created_at: `2026-01-${String(number).padStart(2, '0')}T12:00:00Z` };
}
const matches = [match(1, 3, 0, 'alex'), match(2, 1, 1, 'alex'), match(3, 4, 1, 'ruban'), match(4, 0, 1, 'ruban'), match(5, 6, 0, 'alex'), match(6, 0, 2, 'ruban'), match(7, 3, 2, 'alex'), match(8, 1, 2, 'ruban'), match(9, 4, 0, 'alex'), match(10, 2, 0, 'alex')];

describe('run and scoring records', () => {
  it('rolls tournament instances into one chronological registered-player career', () => {
    const context = buildRecordContext(registeredPlayers, playerInstances, tournaments, [...matches].reverse(), { scope: 'all-time' });
    const alexRows = context.rowsByPlayer.get('rp-a') ?? [];
    expect(alexRows).toHaveLength(10);
    expect(alexRows.map((row) => row.match.id)).toEqual(matches.map((row) => row.id));
    expect(new Set(alexRows.map((row) => row.instanceId))).toEqual(new Set(['p-a1', 'p-a2']));
  });
  it('calculates streak, resilience, dominance, and scoring-performance records', () => {
    const records = calculateRunRecords(buildRecordContext(registeredPlayers, playerInstances, tournaments, matches, { scope: 'all-time' }));
    expect(records.longestUnbeaten[0]).toMatchObject({ playerName: 'Alex', value: 3 });
    expect(records.longestScoring[0]).toMatchObject({ playerName: 'Alex', value: 4 });
    expect(records.longestMotm[0]).toMatchObject({ playerName: 'Alex', value: 2 });
    expect(records.bounceBack[0]).toMatchObject({ playerName: 'Alex', value: 100 });
    expect(records.dominanceRate[0]).toMatchObject({ playerName: 'Alex', value: 66.7 });
    expect(records.threePlusGoals[0]).toMatchObject({ playerName: 'Alex', value: 5 });
    expect(records.fourPlusGoals[0]).toMatchObject({ playerName: 'Alex', value: 3 });
    expect(records.bestMatchOutput[0]).toMatchObject({ playerName: 'Alex', value: 6 });
  });
  it('keeps season-scoped streaks from leaking across tournaments', () => {
    const context = buildRecordContext(registeredPlayers, playerInstances, tournaments, matches, { scope: 'season', seasonId: 's2' });
    const records = calculateRunRecords(context);
    expect(context.rowsByPlayer.get('rp-a')).toHaveLength(2);
    expect(records.longestUnbeaten[0]).toMatchObject({ playerName: 'Alex', value: 2 });
  });
});
