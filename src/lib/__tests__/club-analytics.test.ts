import { describe, expect, it } from 'vitest';
import { clubForSide, getClubMatchups } from '../club-analytics';
import { getTeamHistory } from '../player-insights';
import type { Match } from '../types';

function match(homeClub: string | undefined, awayClub: string | undefined, homeScore: number, awayScore: number): Match {
  return {
    id: `${homeClub}-${awayClub}-${homeScore}-${awayScore}-${Math.random()}`, tournament_id: 't', home_player_id: 'h', away_player_id: 'a',
    home_score: homeScore, away_score: awayScore, round_number: 1, match_number: 1, stage: null,
    is_played: true, is_bye: false, match_order: null, played_at: '2026-01-01', created_at: '',
    stats: { ...(homeClub ? { home_team: homeClub } : {}), ...(awayClub ? { away_team: awayClub } : {}) },
    home_player: { id: 'h', name: 'Home', team: 'Signup Team' } as never,
    away_player: { id: 'a', name: 'Away', team: 'Other Signup Team' } as never,
  };
}

describe('clubs', () => {
  it('uses the club recorded on the match, not the tournament team', () => {
    expect(clubForSide(match('Arsenal', 'France', 1, 0), 'home')).toBe('Arsenal');
    expect(clubForSide(match(undefined, 'France', 1, 0), 'home')).toBe('Signup Team');
  });

  it('builds team history from the real clubs', () => {
    const history = getTeamHistory([match('Arsenal', 'France', 2, 0), match('Arsenal', 'Spain', 0, 1), match('Chelsea', 'Spain', 1, 1)], new Set(['h']));

    expect(history.map((row) => [row.team, row.matches, row.wins, row.draws, row.losses])).toEqual([
      ['Arsenal', 2, 1, 0, 1],
      ['Chelsea', 1, 0, 1, 0],
    ]);
  });

  it('records club-vs-club from the leading side and skips mirror matches', () => {
    const matches = [
      match('Real Madrid', 'City', 2, 0), match('City', 'Real Madrid', 1, 3), match('Real Madrid', 'City', 1, 1),
      match('Real Madrid', 'Real Madrid', 4, 0),
    ];
    expect(getClubMatchups(matches)).toEqual([
      { club: 'Real Madrid', opponent: 'City', meetings: 3, wins: 2, draws: 1, losses: 0, goalsFor: 6, goalsAgainst: 2 },
    ]);
  });
});
