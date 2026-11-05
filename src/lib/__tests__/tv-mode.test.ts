import { describe, expect, it } from 'vitest';
import { projectLiveTable, tournamentLeaders } from '../tv-mode';
import { calculateStandings } from '../algorithms/standings';
import type { Match } from '../types';

const players = ['A', 'B', 'C'].map((id) => ({ id, name: id, team: `${id} FC` }));

function match(id: string, home: string, away: string, score: [number, number] | null, day = 1): Match {
  return {
    id, tournament_id: 't', home_player_id: home, away_player_id: away,
    home_score: score?.[0] ?? null, away_score: score?.[1] ?? null,
    round_number: 1, match_number: day, stage: null, is_played: Boolean(score), is_bye: false,
    stats: {}, match_order: null, played_at: score ? `2026-01-0${day}T20:00:00Z` : null,
  } as Match;
}

describe('live table', () => {
  const matches = [match('m1', 'A', 'B', [2, 0], 1), match('m2', 'B', 'C', [1, 0], 2), match('m3', 'C', 'A', null)];

  it('projects the table from the live score and reports movement', () => {
    // Now: A, B, C. If C beats A 3-0 everyone has 3 points: C (GD +2), then
    // A and B on -1, split by goals scored (A 2, B 1).
    const rows = projectLiveTable(matches, players, { matchId: 'm3', home: 3, away: 0 })!;
    expect(rows.map((row) => row.player_id)).toEqual(['C', 'A', 'B']);
    expect(rows.find((row) => row.player_id === 'C')).toMatchObject({ live_move: 2, playing: true, points: 3 });
    expect(rows.find((row) => row.player_id === 'A')).toMatchObject({ live_move: -1, playing: true });
    expect(rows.find((row) => row.player_id === 'B')).toMatchObject({ live_move: -1, playing: false });
  });

  it('matches the real table at 0-0 apart from the extra draw', () => {
    const rows = projectLiveTable(matches, players, { matchId: 'm3', home: 0, away: 0 })!;
    expect(rows.map((row) => row.player_id)).toEqual(calculateStandings(matches, players).map((row) => row.player_id));
    expect(rows.every((row) => row.live_move === 0)).toBe(true);
  });

  it('ignores a match that is already played or unknown', () => {
    expect(projectLiveTable(matches, players, { matchId: 'm1', home: 0, away: 5 })).toBeNull();
    expect(projectLiveTable(matches, players, { matchId: 'nope', home: 0, away: 0 })).toBeNull();
  });
});

describe('tournament leaders', () => {
  it('picks out attack, defence, streaks and the biggest win', () => {
    const named = [match('m1', 'A', 'B', [4, 0], 1), match('m2', 'A', 'C', [2, 1], 2), match('m3', 'B', 'C', [1, 1], 3)]
      .map((m) => ({ ...m, home_player: { name: m.home_player_id! }, away_player: { name: m.away_player_id! } }));
    const leaders = tournamentLeaders(calculateStandings(named as Match[], players), named);
    expect(leaders).toEqual([
      { label: 'Most goals', name: 'A', value: '6 scored' },
      { label: 'Tightest defence', name: 'A', value: '0.5 conceded a game' },
      { label: 'On fire', name: 'A', value: '2 wins in a row' },
      { label: 'Biggest win', name: 'A', value: '4–0 v B' },
    ]);
  });

  it('is empty before a ball is kicked', () => {
    expect(tournamentLeaders(calculateStandings([], players), [])).toEqual([]);
  });
});
