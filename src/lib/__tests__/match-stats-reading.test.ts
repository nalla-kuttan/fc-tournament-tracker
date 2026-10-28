import { describe, expect, it } from 'vitest';
import { resolveSides, teamRatings, toReadStatsResult, type StatsReading } from '../match-stats-reading';

function reading(overrides: Partial<StatsReading> = {}): StatsReading {
  return {
    is_match_stats_screen: true,
    left: { team_name: 'FC Barcelona', goals: 3, possession: 58, xg: 2.41, tackles: 14, interceptions: 9 },
    right: { team_name: 'Tottenham Hotspur', goals: 1, possession: 42, xg: 0.87, tackles: 11, interceptions: 12 },
    player_of_the_match: { side: 'left', rating: 9.1 },
    ...overrides,
  };
}

const fixture = { homeTeam: 'Barcelona', awayTeam: 'Tottenham' };

describe('photo side resolution', () => {
  it('keeps the screen order when the left team is the home side', () => {
    expect(resolveSides(reading(), 'Barcelona', 'Tottenham')).toEqual({ swapped: false, uncertain: false });
  });

  it('swaps when the home side is printed on the right', () => {
    expect(resolveSides(reading(), 'Tottenham', 'Barcelona')).toEqual({ swapped: true, uncertain: false });
  });

  it('flags the guess when team names do not settle it', () => {
    expect(resolveSides(reading(), 'Various', 'Various')).toEqual({ swapped: false, uncertain: true });
  });
});

describe('photo reading result', () => {
  it('fills the score and sheet for the matching sides', () => {
    const result = toReadStatsResult(reading(), fixture);

    expect(result.score).toEqual({ home: 3, away: 1 });
    expect(result.sheet).toEqual({
      homeXg: '2.41', awayXg: '0.87', homePossession: '58', homeTackles: '14', awayTackles: '11',
      homeInterceptions: '9', awayInterceptions: '12', motmSide: 'home', motmRating: '9.1',
      homeRating: '9.1', awayRating: '6.0',
    });
    expect(result.filledFields).toBe(13);
    expect(result.sidesUncertain).toBe(false);
  });

  it('maps values to the right players when the screen is reversed', () => {
    const result = toReadStatsResult(reading(), { homeTeam: 'Tottenham', awayTeam: 'Barcelona' });

    expect(result.score).toEqual({ home: 1, away: 3 });
    expect(result.sheet).toMatchObject({
      homeXg: '0.87', awayXg: '2.41', homePossession: '42', motmSide: 'away', homeRating: '6.0', awayRating: '9.1',
    });
  });

  it('drops values that cannot be real instead of filling them in', () => {
    const result = toReadStatsResult(reading({
      left: { team_name: 'Barcelona', goals: 2.5, possession: 140, xg: -1, tackles: 14, interceptions: null },
    }), fixture);

    expect(result.score).toBeNull();
    expect(result.sheet).not.toHaveProperty('homePossession');
    expect(result.sheet).not.toHaveProperty('homeXg');
    expect(result.sheet).not.toHaveProperty('homeInterceptions');
    expect(result.sheet.homeTackles).toBe('14');
    expect(result.sheet).not.toHaveProperty('homeRating');
    expect(result.sheet).not.toHaveProperty('awayRating');
  });

  it('fills nothing when the photo is not a stats screen', () => {
    expect(toReadStatsResult(reading({ is_match_stats_screen: false }), fixture)).toEqual({
      score: null, sheet: {}, filledFields: 0, sidesUncertain: false, notStatsScreen: true,
    });
  });
});

describe('team ratings from the score', () => {
  const side = (goals: number | null, xg: number | null = null) => ({ goals, xg });

  it('rates a level draw at 7.8 for both sides', () => {
    expect(teamRatings(side(2, 1.4), side(2, 1.4))).toEqual({ home: 7.8, away: 7.8 });
  });

  it('rates the winner above the loser on the group\'s scale', () => {
    expect(teamRatings(side(2), side(1))).toEqual({ home: 8.4, away: 6.9 });
    expect(teamRatings(side(0), side(3))).toEqual({ home: 5.4, away: 9.2 });
  });

  it('keeps thrashings inside 0 to 10', () => {
    expect(teamRatings(side(13, 6), side(1, 0.2))).toEqual({ home: 10, away: 0 });
  });

  it('nudges by xG but never more than 0.3', () => {
    expect(teamRatings(side(1, 10), side(1, 0))).toEqual({ home: 8.1, away: 7.5 });
  });

  it('rates from the score alone when xG is missing', () => {
    expect(teamRatings(side(2, 1.9), side(1, null))).toEqual({ home: 8.4, away: 6.9 });
  });

  it('gives no rating without a score', () => {
    expect(teamRatings(side(null, 1.2), side(1, 0.8))).toBeNull();
  });
});
