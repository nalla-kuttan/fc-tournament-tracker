import { describe, expect, it } from 'vitest';
import {
  EMPTY_SHEET,
  goalMinuteError,
  goalsForScore,
  mergeStatsForSave,
  nextFixture,
  sheetFromStats,
  statsFromSheet,
  swapSheetSides,
  validateSheet,
} from '../match-entry';

const players = { homeId: 'home', awayId: 'away' };

describe('stat sheet', () => {
  it('saves only the values that were entered, with away possession derived', () => {
    const stats = statsFromSheet({ ...EMPTY_SHEET, homeXg: '1,85', homePossession: '58', homeRating: '7.25' }, players);

    expect(stats).toEqual({ home_xg: 1.85, home_possession: 58, away_possession: 42, home_rating: 7.3 });
  });

  it('does not invent defaults for an untouched sheet', () => {
    expect(statsFromSheet(EMPTY_SHEET, players)).toEqual({});
  });

  it('round-trips saved stats, including the Man of the Match side', () => {
    const saved = {
      home_xg: 2.4, away_xg: 0.9, home_possession: 61, away_possession: 39, home_tackles: 12, away_tackles: 9,
      home_interceptions: 7, away_interceptions: 11, home_rating: 8.1, away_rating: 6.4,
      motm_player_id: 'away', motm_rating: 8.8,
    };
    const sheet = sheetFromStats(saved, players);

    expect(sheet.motmSide).toBe('away');
    expect(statsFromSheet(sheet, players)).toEqual(saved);
  });

  it('flags out-of-range, non-numeric, and fractional-count values', () => {
    const errors = validateSheet({ ...EMPTY_SHEET, homeXg: '25', awayXg: 'abc', homeTackles: '3.5', homeRating: '10.1' });

    expect(errors).toEqual({
      homeXg: 'xG must be 0–20',
      awayXg: 'Enter a number',
      homeTackles: 'Use a whole number',
      homeRating: 'Rating must be 0–10',
    });
  });

  it('asks for the Man of the Match before their rating', () => {
    expect(validateSheet({ ...EMPTY_SHEET, motmRating: '9' })).toEqual({ motmRating: 'Pick the Man of the Match first' });
  });

  it('swaps every paired value and mirrors possession', () => {
    const swapped = swapSheetSides({ ...EMPTY_SHEET, homeXg: '2.1', awayXg: '0.4', homePossession: '60', homeTackles: '10', motmSide: 'home', motmRating: '9' });

    expect(swapped).toMatchObject({ homeXg: '0.4', awayXg: '2.1', homePossession: '40', awayTackles: '10', homeTackles: '', motmSide: 'away', motmRating: '9' });
  });
});

describe('goal rows', () => {
  it('follows the score and keeps minutes already typed', () => {
    const current = [{ player_id: 'home', minute: '12' }, { player_id: 'away', minute: '70' }];

    expect(goalsForScore(current, 'home', 'away', 2, 0)).toEqual([
      { player_id: 'home', minute: '12' },
      { player_id: 'home', minute: '' },
    ]);
  });

  it('validates optional minutes', () => {
    expect(goalMinuteError('')).toBeNull();
    expect(goalMinuteError('45')).toBeNull();
    expect(goalMinuteError('0')).toBe('Minute must be 1–130');
    expect(goalMinuteError('131')).toBe('Minute must be 1–130');
  });
});

describe('next fixture', () => {
  const fixture = (id: string, overrides: Record<string, unknown> = {}) => ({
    id, is_played: false, is_bye: false, home_player_id: 'a', away_player_id: 'b', round_number: 1, match_number: 1, match_order: null, ...overrides,
  });

  it('picks the earliest playable fixture after the current one', () => {
    const matches = [
      fixture('current', { match_order: 1 }),
      fixture('played', { match_order: 2, is_played: true }),
      fixture('bye', { match_order: 3, is_bye: true }),
      fixture('tbd', { match_order: 4, away_player_id: null }),
      fixture('later', { match_order: 6 }),
      fixture('next', { match_order: 5 }),
    ];

    expect(nextFixture(matches, 'current')?.id).toBe('next');
  });

  it('falls back to round and match number when there is no match order', () => {
    const matches = [fixture('r2', { round_number: 2 }), fixture('r1m2', { match_number: 2 }), fixture('r1m1')];

    expect(nextFixture(matches, 'x')?.id).toBe('r1m1');
  });

  it('returns null when every fixture is recorded', () => {
    expect(nextFixture([fixture('only')], 'only')).toBeNull();
  });
});

describe('saving an edit', () => {
  it('keeps stored stats the sheet does not manage, such as the in-game clubs', () => {
    const existing = { home_team: 'Arsenal', away_team: 'France', motm_team: 'France', home_xg: 2, away_rating: 7.5 };
    const fromSheet = statsFromSheet({ ...EMPTY_SHEET, homeXg: '2.4' }, players);

    expect(mergeStatsForSave(existing, fromSheet)).toEqual({
      home_team: 'Arsenal', away_team: 'France', motm_team: 'France', home_xg: 2.4,
    });
  });

  it('clears a managed stat that was blanked on the sheet', () => {
    expect(mergeStatsForSave({ away_rating: 7.5 }, {})).toEqual({});
  });
});
