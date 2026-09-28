import { describe, expect, it } from 'vitest';
import { backtestOdds, drawRate, oddsForFixture, predictResult } from '../match-odds';
import type { Match } from '../types';

const players = [
  { id: 'rA', name: 'Alex', base_team: 'A' },
  { id: 'rB', name: 'Basil', base_team: 'B' },
];
const instances = [{ id: 'a', registered_player_id: 'rA' }, { id: 'b', registered_player_id: 'rB' }];

function game(index: number, homeScore: number | null, awayScore: number | null, played = true): Match {
  return {
    id: `m${index}`, tournament_id: 't', home_player_id: 'a', away_player_id: 'b',
    home_score: homeScore, away_score: awayScore, round_number: 1, match_number: index, stage: null,
    is_played: played, is_bye: false, stats: {}, match_order: index,
    played_at: played ? new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString() : null, created_at: '',
  };
}

describe('match odds', () => {
  it('always adds up to one and is even between equal ratings', () => {
    const odds = predictResult(1100, 1100, 0.1);
    expect(odds.home + odds.draw + odds.away).toBeCloseTo(1, 10);
    expect(odds.home).toBeCloseTo(odds.away, 10);
    expect(predictResult(1300, 1000, 0.1).home).toBeGreaterThan(0.7);
  });

  it('smooths the draw rate so a few early draws cannot dominate', () => {
    expect(drawRate([game(1, 1, 1), game(2, 2, 2)])).toBeCloseTo(3 / 12, 10);
  });

  it('gives a played match the pre-match view, blind to its own result', () => {
    const history = Array.from({ length: 5 }, (_, i) => game(i + 1, 2, 0));
    const blowout = [...history, game(6, 0, 9)];
    const beforeSix = oddsForFixture(players, instances, blowout, blowout[5])!;
    const sameHistoryOtherResult = oddsForFixture(players, instances, [...history, game(6, 3, 0)], game(6, 3, 0))!;

    expect(beforeSix.preMatch).toBe(true);
    expect(beforeSix.odds).toEqual(sameHistoryOtherResult.odds);
    expect(beforeSix.odds.home).toBeGreaterThan(beforeSix.odds.away);
  });

  it('uses current ratings for an unplayed fixture', () => {
    const history = Array.from({ length: 5 }, (_, i) => game(i + 1, 0, 3));
    const next = oddsForFixture(players, instances, history, game(99, null, null, false))!;

    expect(next.preMatch).toBe(false);
    expect(next.odds.away).toBeGreaterThan(next.odds.home);
  });

  it('scores only matches after the warm-up, each from earlier results', () => {
    const history = Array.from({ length: 40 }, (_, i) => game(i + 1, 2, 1));
    const record = backtestOdds(players, instances, history);

    expect(record.matches).toBe(10);
    // Alex wins every time, so once he is rated higher the favourite is always right.
    expect(record.accuracy).toBe(1);
  });
});
