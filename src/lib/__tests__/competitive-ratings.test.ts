import { describe, expect, it } from 'vitest';
import { buildCompetitiveRatingTimeline, calculateCompetitiveRatings, ratingChange } from '../competitive-ratings';
import type { Match } from '../types';

const players = [
  { id: 'rA', name: 'Alex', base_team: 'A' },
  { id: 'rB', name: 'Basil', base_team: 'B' },
  { id: 'rC', name: 'Cara', base_team: 'C' },
];
const instances = ['t1', 't2', 't3'].flatMap((tournament) =>
  players.map((player) => ({ id: `${player.id}-${tournament}`, registered_player_id: player.id }))
);

let n = 0;
function game(tournament: string, home: string, away: string, hs: number, as: number): Match {
  n++;
  return {
    id: `m${n}`, tournament_id: tournament, home_player_id: `${home}-${tournament}`, away_player_id: `${away}-${tournament}`,
    home_score: hs, away_score: as, round_number: 1, match_number: n, stage: null, is_played: true, is_bye: false,
    stats: {}, match_order: n, played_at: new Date(Date.UTC(2026, 0, 1, 0, n)).toISOString(), created_at: '',
  };
}

describe('competitive ratings', () => {
  it('keeps a dominant player within reach instead of drifting away', () => {
    const settled = Array.from({ length: 10 }, () => game('t1', 'rA', 'rB', 1, 1));
    const streak = Array.from({ length: 20 }, () => game('t1', 'rA', 'rB', 3, 0));
    const [top, bottom] = calculateCompetitiveRatings(players, instances, [...settled, ...streak], { scope: 'all-time' });
    expect(top.rating - bottom.rating).toBeLessThan(300);
  });

  it('shrinks the margin bonus when the favourite wins big', () => {
    const favouriteBonus = ratingChange(1200, 900, 5, 0) / ratingChange(1200, 900, 1, 0);
    const evenBonus = ratingChange(1000, 1000, 5, 0) / ratingChange(1000, 1000, 1, 0);
    const underdogBonus = ratingChange(900, 1200, 5, 0) / ratingChange(900, 1200, 1, 0);
    expect(favouriteBonus).toBeLessThan(evenBonus);
    expect(underdogBonus).toBeGreaterThan(evenBonus);
  });

  it('keeps the margin bonus gentle', () => {
    expect(ratingChange(1000, 1000, 5, 0) / ratingChange(1000, 1000, 1, 0)).toBeLessThanOrEqual(1.5);
    expect(ratingChange(1000, 1000, 1, 1)).toBe(0);
  });

  it('pulls ratings part of the way back to 1000 when a new tournament starts', () => {
    const history = [...Array.from({ length: 8 }, () => game('t1', 'rA', 'rB', 2, 0)), game('t2', 'rA', 'rB', 1, 1)];
    const timeline = buildCompetitiveRatingTimeline(players, instances, history, { scope: 'all-time' });
    const endOfFirst = calculateCompetitiveRatings(players, instances, history.slice(0, -1), { scope: 'all-time' })
      .find((row) => row.player.id === 'rA')!.rating;
    const startOfSecond = timeline.get(history[history.length - 1].id)!.homeRating;
    expect(endOfFirst).toBeGreaterThan(1000);
    expect(startOfSecond).toBeLessThan(endOfFirst);
    expect(startOfSecond).toBeGreaterThan(1000);
  });

  it('only pulls back players who take part, and only once however many tournaments they miss', () => {
    const opening = Array.from({ length: 8 }, () => game('t1', 'rA', 'rB', 2, 0));
    const missed = [game('t2', 'rB', 'rC', 1, 1)];
    const comeback = game('t3', 'rA', 'rC', 1, 1);
    const afterOpening = calculateCompetitiveRatings(players, instances, opening, { scope: 'all-time' })
      .find((row) => row.player.id === 'rA')!.rating;
    const whileAway = calculateCompetitiveRatings(players, instances, [...opening, ...missed], { scope: 'all-time' })
      .find((row) => row.player.id === 'rA')!.rating;
    const onReturn = buildCompetitiveRatingTimeline(players, instances, [...opening, ...missed, comeback], { scope: 'all-time' })
      .get(comeback.id)!.homeRating;
    expect(whileAway).toBe(afterOpening);
    expect(onReturn).toBe(Math.round(1000 + (afterOpening - 1000) * 0.9));
  });

  it('starts new players below the average', () => {
    const first = game('t1', 'rA', 'rB', 1, 1);
    const snapshot = buildCompetitiveRatingTimeline(players, instances, [first], { scope: 'all-time' }).get(first.id)!;
    expect(snapshot.homeRating).toBe(925);
    expect(snapshot.awayRating).toBe(925);
  });

  it('moves a new player faster than a settled regular', () => {
    const settled = Array.from({ length: 10 }, () => game('t1', 'rA', 'rB', 1, 1));
    const debut = game('t1', 'rC', 'rA', 2, 0);
    const rows = calculateCompetitiveRatings(players, instances, [...settled, debut], { scope: 'all-time' });
    const change = (id: string) => rows.find((row) => row.player.id === id)!.movement;
    expect(change('rC')).toBeGreaterThan(2 * -change('rA'));
    expect(change('rA')).toBeLessThan(0);
  });
});
