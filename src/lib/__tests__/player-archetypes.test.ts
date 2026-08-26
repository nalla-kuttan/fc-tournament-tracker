import { describe, expect, it } from 'vitest';
import type { CareerStats } from '@/lib/types';
import { getPlayerArchetype, getPlayerTags } from '@/lib/player-insights';

function stats(overrides: Partial<CareerStats> = {}): CareerStats {
  return {
    registered_player_id: 'player-1',
    player_name: 'Test Player',
    base_team: 'Test FC',
    total_matches: 12,
    wins: 5,
    draws: 2,
    losses: 5,
    total_goals: 14,
    total_conceded: 24,
    clean_sheets: 1,
    avg_xg: 1.4,
    avg_rating: 7.2,
    avg_possession: 50,
    motm_awards: 1,
    win_rate: 41.7,
    goals_per_match: 1.17,
    ...overrides,
  };
}

describe('getPlayerArchetype', () => {
  it.each([
    ['Clinical Finisher', { goals_per_match: 2, avg_xg: 1.5, total_goals: 24 }],
    ['Counterpuncher', { avg_possession: 46, win_rate: 62, wins: 8 }],
    ['Iron Curtain', { total_conceded: 12, clean_sheets: 3 }],
    ['Rating Machine', { avg_rating: 8.3 }],
    ['Relentless Attacker', { goals_per_match: 2.1, avg_xg: 2, total_goals: 25 }],
  ] satisfies Array<[string, Partial<CareerStats>]>)('recognizes a %s', (expected, overrides) => {
    expect(getPlayerArchetype(stats(overrides))).toBe(expected);
  });

  it('requires a meaningful sample for the new performance archetypes', () => {
    expect(getPlayerArchetype(stats({
      total_matches: 9,
      total_goals: 18,
      goals_per_match: 2,
      avg_xg: 1.5,
    }))).toBe('Balanced Operator');
  });

  it('keeps established standout archetypes ahead of overlapping new profiles', () => {
    expect(getPlayerArchetype(stats({
      goals_per_match: 2.6,
      total_goals: 32,
      avg_xg: 1.5,
      clean_sheets: 6,
      avg_rating: 8.5,
    }))).toBe('Finisher');

    expect(getPlayerArchetype(stats({
      goals_per_match: 1.8,
      total_goals: 22,
      avg_xg: 1.4,
      clean_sheets: 6,
      avg_rating: 8.5,
    }))).toBe('Defensive Wall');
  });
});

describe('getPlayerTags', () => {
  it('returns at most the first three qualifying tags in deterministic priority order', () => {
    expect(getPlayerTags(stats({
      total_matches: 32,
      wins: 23,
      total_goals: 70,
      goals_per_match: 2.19,
      avg_xg: 1.7,
      avg_rating: 8.4,
      avg_possession: 57,
      motm_awards: 10,
      win_rate: 71.9,
    }))).toEqual(['xG Beater', 'Goal Machine', 'Elite Rated']);
  });

  it('does not award performance tags below the minimum sample', () => {
    expect(getPlayerTags(stats({
      total_matches: 9,
      total_goals: 23,
      goals_per_match: 2.56,
      avg_xg: 1.5,
      clean_sheets: 5,
      avg_rating: 8.5,
      avg_possession: 60,
      motm_awards: 5,
      win_rate: 77.8,
    }))).toEqual([]);
  });

  it('uses captured longevity and match-profile data for secondary tags', () => {
    expect(getPlayerTags(stats({
      total_matches: 30,
      total_goals: 45,
      total_conceded: 110,
      goals_per_match: 1.5,
      avg_xg: 1.5,
      avg_rating: 7.4,
      avg_possession: 45,
      motm_awards: 2,
      win_rate: 58,
    }))).toEqual(['Veteran', 'Entertainer', 'Counter Threat']);
  });
});
