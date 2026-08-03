import { describe, expect, it } from 'vitest';
import { calculateStandings } from '../algorithms/standings';
import { aggregateCareerStats, aggregateCareerStatsBatch } from '../algorithms/stats';
import type { Match } from '../types';

const player = (id: string) => ({ id, name: id, team: `${id} FC` });

function match(
  id: string,
  home_player_id: string,
  away_player_id: string,
  home_score: number,
  away_score: number,
  stats: Match['stats'] = {}
): Match {
  return {
    id,
    tournament_id: 'tournament',
    home_player_id,
    away_player_id,
    home_score,
    away_score,
    round_number: 1,
    match_number: Number(id.replace(/\D/g, '')) || 1,
    stage: null,
    is_played: true,
    is_bye: false,
    stats,
    match_order: null,
    played_at: `2026-01-${String(Number(id.replace(/\D/g, '')) || 1).padStart(2, '0')}T20:00:00Z`,
    created_at: '2026-01-01T19:00:00Z',
  };
}

describe('standings tie-breakers', () => {
  it('uses head-to-head for a complete two-player primary tie', () => {
    const matches = [
      match('m1', 'A', 'B', 1, 0),
      match('m2', 'X', 'A', 1, 0),
      match('m3', 'B', 'Y', 1, 0),
      match('m4', 'X', 'Y', 2, 0),
    ];

    const standings = calculateStandings(matches, ['A', 'B', 'X', 'Y'].map(player));
    expect(standings.filter((row) => row.player_id === 'A' || row.player_id === 'B').map((row) => row.player_id))
      .toEqual(['A', 'B']);
  });

  it('uses a mini-table for a three-way tie instead of non-transitive pair comparisons', () => {
    const matches = [
      match('m1', 'A', 'B', 2, 0),
      match('m2', 'A', 'C', 1, 0),
      match('m3', 'B', 'C', 1, 0),
      match('m4', 'X', 'A', 3, 0),
      match('m5', 'B', 'Y', 2, 1),
      match('m6', 'C', 'Z', 1, 0),
      match('m7', 'C', 'W', 2, 1),
    ];

    const standings = calculateStandings(matches, ['A', 'B', 'C', 'W', 'X', 'Y', 'Z'].map(player));
    expect(standings.filter((row) => ['A', 'B', 'C'].includes(row.player_id)).map((row) => row.player_id))
      .toEqual(['A', 'B', 'C']);
  });
});

describe('batched career aggregation', () => {
  it('matches the legacy per-player calculation while scanning shared data once', () => {
    const registered = [
      { id: 'rA', name: 'A', base_team: 'A FC' },
      { id: 'rB', name: 'B', base_team: 'B FC' },
    ];
    const instances = [
      { id: 'A', registered_player_id: 'rA' },
      { id: 'B', registered_player_id: 'rB' },
    ];
    const matches = [
      match('m1', 'A', 'B', 3, 1, {
        home_xg: 2.4,
        away_xg: 0.8,
        home_rating: 8.2,
        away_rating: 6.1,
        home_possession: 55,
        away_possession: 45,
        motm_player_id: 'A',
      }),
      match('m2', 'B', 'A', 0, 0, {
        home_xg: 1.1,
        away_xg: 1.3,
        home_rating: 7,
        away_rating: 7.2,
        home_possession: 48,
        away_possession: 52,
      }),
    ];
    const goals = [{ player_id: 'A' }, { player_id: 'A' }, { player_id: 'B' }];

    const batched = aggregateCareerStatsBatch(registered, instances, matches, goals);
    for (const registeredPlayer of registered) {
      const playerIds = instances
        .filter((instance) => instance.registered_player_id === registeredPlayer.id)
        .map((instance) => instance.id);
      const legacy = aggregateCareerStats(
        registeredPlayer.id,
        registeredPlayer.name,
        registeredPlayer.base_team,
        playerIds,
        matches,
        goals
      );
      expect(batched.find((row) => row.registered_player_id === registeredPlayer.id)).toEqual(legacy);
    }
  });
});
