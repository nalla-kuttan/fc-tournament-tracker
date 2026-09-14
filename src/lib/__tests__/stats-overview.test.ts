import { describe, expect, it } from 'vitest';
import { getStatsOverview } from '../stats-overview';
import type { Match } from '../types';
const players = [{ id: 'a', name: 'Alex' }, { id: 'b', name: 'Basil' }];
const instances = [{ id: 'a1', registered_player_id: 'a' }, { id: 'a2', registered_player_id: 'a' }, { id: 'b1', registered_player_id: 'b' }];
const now = Date.parse('2026-09-14T12:00:00Z');
const match = (i: number, overrides: Partial<Match> = {}): Match => ({ id: String(i), tournament_id: 't', home_player_id: 'a1', away_player_id: 'b1', home_score: 2, away_score: 0, round_number: 1, match_number: i, stage: null, is_played: true, is_bye: false, stats: {}, match_order: i, played_at: new Date(now - i * 86400000).toISOString(), created_at: '', ...overrides });
describe('stats overview', () => {
  it('excludes byes, unplayed and unscored games; limits recent periods to recorded dates', () => {
    const games = [match(1), match(2, { is_bye: true }), match(3, { is_played: false }), match(4, { home_score: null }), match(40), match(5, { played_at: null })];
    expect(getStatsOverview(games, players, instances, '30', now).games).toHaveLength(1);
    const all = getStatsOverview(games, players, instances, 'all', now);
    expect(all.games).toHaveLength(3);
    expect(all.undated).toBe(1);
  });
  it('merges player identities across tournaments and compares two groups of five', () => {
    const games = Array.from({ length: 10 }, (_, i) => match(i, { home_player_id: i % 2 ? 'a2' : 'a1', home_score: i < 5 ? 2 : 0, away_score: i < 5 ? 0 : 2 }));
    const result = getStatsOverview(games, players, instances, 'all', now);
    expect(result.improving[0]).toMatchObject({ id: 'a', played: 10, latestPoints: 15, previousPoints: 0, improvement: 15 });
    expect(result.scorers).toHaveLength(2);
  });
  it('never infers improvement from too few dated matches', () => {
    expect(getStatsOverview([match(1), match(2, { played_at: null })], players, instances, 'all', now).improving).toEqual([]);
  });
  it('handles empty periods without inventing a leader', () => {
    const result = getStatsOverview([match(40)], players, instances, '30', now);
    expect(result.scorers).toEqual([]);
    expect(result.goals).toBe(0);
  });
});
