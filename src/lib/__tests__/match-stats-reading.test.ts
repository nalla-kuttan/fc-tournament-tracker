import { describe, expect, it } from 'vitest';
import { resolveSides, toReadStatsResult, type StatsReading } from '../match-stats-reading';

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
    });
    expect(result.filledFields).toBe(11);
    expect(result.sidesUncertain).toBe(false);
  });

  it('maps values to the right players when the screen is reversed', () => {
    const result = toReadStatsResult(reading(), { homeTeam: 'Tottenham', awayTeam: 'Barcelona' });

    expect(result.score).toEqual({ home: 1, away: 3 });
    expect(result.sheet).toMatchObject({ homeXg: '0.87', awayXg: '2.41', homePossession: '42', motmSide: 'away' });
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
  });

  it('fills nothing when the photo is not a stats screen', () => {
    expect(toReadStatsResult(reading({ is_match_stats_screen: false }), fixture)).toEqual({
      score: null, sheet: {}, filledFields: 0, sidesUncertain: false, notStatsScreen: true,
    });
  });
});
