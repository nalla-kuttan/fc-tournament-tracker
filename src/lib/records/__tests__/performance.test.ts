import { describe, expect, it } from 'vitest';
import { buildRecordContext } from '../context';
import { calculateExpectedPoints, calculatePerformanceRecords } from '../performance';
import type { Match, Player, RegisteredPlayer, Tournament } from '@/lib/types';

const registeredPlayers: RegisteredPlayer[] = [
  { id: 'rp-a', name: 'Alex', base_team: 'Chelsea', created_at: '' },
  { id: 'rp-b', name: 'Ruban', base_team: 'Liverpool', created_at: '' },
];
const playerInstances: Player[] = [
  { id: 'p-a', tournament_id: 't1', registered_player_id: 'rp-a', name: 'Alex', team: 'Chelsea', seed: 1, created_at: '' },
  { id: 'p-b', tournament_id: 't1', registered_player_id: 'rp-b', name: 'Ruban', team: 'Liverpool', seed: 2, created_at: '' },
];
const tournaments: Tournament[] = [
  { id: 't1', name: 'League', format: 'league', pin: '', status: 'completed', season_id: 's1', created_at: '' },
];

function performanceMatch(index: number, includeOptionalStats = true): Match {
  return {
    id: `m-${index}`,
    tournament_id: 't1',
    season_id: 's1',
    home_player_id: 'p-a',
    away_player_id: 'p-b',
    home_score: 2,
    away_score: 1,
    round_number: index,
    match_number: index,
    stage: null,
    is_played: true,
    is_bye: false,
    stats: includeOptionalStats ? {
      home_xg: 1,
      away_xg: 1.5,
      home_possession: 45,
      away_possession: 55,
      home_tackles: 10,
      away_tackles: 8,
      home_interceptions: 5,
      away_interceptions: 4,
      home_rating: 8,
      away_rating: 7,
      motm_player_id: 'p-a',
    } : {},
    match_order: index,
    played_at: `2026-01-${String(index).padStart(2, '0')}T12:00:00Z`,
    created_at: '',
  };
}

describe('advanced performance records', () => {
  it('normalizes Poisson score probabilities when calculating expected points', () => {
    expect(calculateExpectedPoints(0, 0)).toBe(1);
    expect(calculateExpectedPoints(2, 0.5)).toBeGreaterThan(2);
    expect(calculateExpectedPoints(0.5, 2)).toBeLessThan(1);
  });

  it('calculates every captured advanced performance metric', () => {
    const matches = Array.from({ length: 10 }, (_, index) => performanceMatch(index + 1));
    const context = buildRecordContext(registeredPlayers, playerInstances, tournaments, matches, { scope: 'all-time' });
    const records = calculatePerformanceRecords(context);

    expect(records.finishingEfficiency[0]).toMatchObject({ playerName: 'Alex', value: 200, sampleSize: 10 });
    expect(records.xgOverperformance[0]).toMatchObject({ playerName: 'Alex', value: 10, sampleSize: 10 });
    expect(records.defensiveXgOverperformance[0]).toMatchObject({ playerName: 'Alex', value: 5, sampleSize: 10 });
    expect(records.counterpunchWinRate[0]).toMatchObject({ playerName: 'Alex', value: 100, sampleSize: 10 });
    expect(records.motmRate[0]).toMatchObject({ playerName: 'Alex', value: 100, sampleSize: 10 });
    expect(records.defensiveWorkRate[0]).toMatchObject({ playerName: 'Alex', value: 15, sampleSize: 10 });
    expect(records.ratingConsistency[0]).toMatchObject({ playerName: 'Alex', value: 0, sampleSize: 10 });
    expect(records.expectedPointsSurplus[0]).toMatchObject({ playerName: 'Alex', sampleSize: 10 });
    expect(records.expectedPointsSurplus[0].value).toBeGreaterThan(0);
    expect(records.pressurePerformance[0]).toMatchObject({ playerName: 'Ruban', value: 0, sampleSize: 9 });
  });

  it('excludes missing optional stats from only the affected metric denominator', () => {
    const matches = [
      ...Array.from({ length: 9 }, (_, index) => performanceMatch(index + 1)),
      performanceMatch(10, false),
    ];
    const context = buildRecordContext(registeredPlayers, playerInstances, tournaments, matches, { scope: 'all-time' });
    const records = calculatePerformanceRecords(context);

    expect(records.finishingEfficiency).toEqual([]);
    expect(records.motmRate).toEqual([]);
    expect(records.defensiveWorkRate).toEqual([]);
    expect(records.ratingConsistency).toEqual([]);
    expect(context.rowsByPlayer.get('rp-a')).toHaveLength(10);
  });
});
