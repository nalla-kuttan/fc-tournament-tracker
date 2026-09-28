import { describe, expect, it } from 'vitest';
import { getRatingHistory, getTournamentChampions } from '../tournament-results';
import { getCompetitiveRatingMap } from '../competitive-ratings';
import type { Match } from '../types';

const players = [
  { id: 'rA', name: 'Alex', base_team: 'A' },
  { id: 'rB', name: 'Basil', base_team: 'B' },
  { id: 'rC', name: 'Cara', base_team: 'C' },
];
const instances = ['t1', 't2', 't3'].flatMap((t) => players.map((p) => ({ id: `${p.id}-${t}`, registered_player_id: p.id, tournament_id: t, name: p.name, team: 'Team' })));

let n = 0;
function game(t: string, home: string, away: string, hs: number, as: number, stage: string | null = null): Match {
  n++;
  return {
    id: `m${n}`, tournament_id: t, home_player_id: `${home}-${t}`, away_player_id: `${away}-${t}`,
    home_score: hs, away_score: as, round_number: 1, match_number: n, stage, is_played: true, is_bye: false,
    stats: {}, match_order: n, played_at: new Date(Date.UTC(2026, 0, n)).toISOString(), created_at: '',
  };
}

describe('tournament champions', () => {
  it('uses the final for knockouts and the table for completed leagues only', () => {
    const matches = [
      game('t1', 'rA', 'rB', 2, 0), game('t1', 'rB', 'rC', 1, 0), game('t1', 'rA', 'rC', 1, 1),
      game('t2', 'rC', 'rB', 3, 1, 'F'),
      game('t3', 'rB', 'rA', 5, 0),
    ];
    const champions = getTournamentChampions([
      { id: 't1', name: 'League', format: 'league', status: 'completed' },
      { id: 't2', name: 'Cup', format: 'knockout', status: 'completed' },
      { id: 't3', name: 'Ongoing', format: 'league', status: 'active' },
    ], instances, matches);

    expect(champions.get('t1')?.registeredPlayerId).toBe('rA');
    expect(champions.get('t2')?.registeredPlayerId).toBe('rC');
    expect(champions.has('t3')).toBe(false);
  });
});

describe('rating history', () => {
  it('chains each match rating into the next and ends at the current rating', () => {
    const matches = [game('t1', 'rA', 'rB', 3, 0), game('t1', 'rC', 'rA', 2, 0), game('t1', 'rA', 'rB', 1, 1)];
    const history = getRatingHistory(players, instances, matches, 'rA');

    expect(history.map((point) => point.result)).toEqual(['W', 'L', 'D']);
    expect(history[0].ratingBefore).toBe(1000);
    for (let i = 1; i < history.length; i++) expect(history[i].ratingBefore).toBe(history[i - 1].ratingAfter);
    expect(history.at(-1)!.ratingAfter).toBe(getCompetitiveRatingMap(players, instances, matches).get('rA'));
  });
});
