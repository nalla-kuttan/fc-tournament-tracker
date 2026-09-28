import { describe, expect, it } from 'vitest';
import { buildTournamentRecap } from '../tournament-recap';
import type { Match } from '../types';

const players = [
  { id: 'rA', name: 'Alex', base_team: 'A' },
  { id: 'rB', name: 'Basil', base_team: 'B' },
  { id: 'rC', name: 'Cara', base_team: 'C' },
];
const instances = players.map((p) => ({ id: `${p.id}-t`, registered_player_id: p.id, tournament_id: 't', name: p.name, team: 'Team' }));

let n = 0;
function game(home: string, away: string, hs: number, as: number, stats: Match['stats'] = {}): Match {
  n++;
  return {
    id: `m${n}`, tournament_id: 't', home_player_id: `${home}-t`, away_player_id: `${away}-t`,
    home_score: hs, away_score: as, round_number: 1, match_number: n, stage: null, is_played: true, is_bye: false,
    stats, match_order: n, played_at: new Date(Date.UTC(2026, 0, n)).toISOString(), created_at: '',
  };
}

const matches = [
  game('rA', 'rB', 4, 0, { home_rating: 9, away_rating: 6, motm_player_id: 'rA-t' }),
  game('rB', 'rC', 2, 1, { home_rating: 8, away_rating: 7, motm_player_id: 'rB-t' }),
  game('rC', 'rA', 1, 1, { home_rating: 7, away_rating: 8 }),
];
const goals = [
  ...Array.from({ length: 5 }, () => ({ player_id: 'rA-t', match_id: 'm1' })),
  { player_id: 'rB-t', match_id: 'm2' }, { player_id: 'rB-t', match_id: 'm2' },
  { player_id: 'rC-t', match_id: 'm2' }, { player_id: 'rC-t', match_id: 'm3' },
];

describe('tournament recap', () => {
  it('summarises a completed league', () => {
    const recap = buildTournamentRecap({ id: 't', name: 'Spring', format: 'league', status: 'completed' }, players, instances, matches, goals);

    expect(recap).toMatchObject({ decided: true, champion: 'Alex', matchesPlayed: 3, goals: 9 });
    expect(recap.podium.map((row) => row.player_name)).toEqual(['Alex', 'Basil', 'Cara']);
    expect(recap.awards.find((a) => a.label === 'Top scorer')).toMatchObject({ winners: ['Alex'], value: '5 goals' });
    // Alex and Basil each have one Man of the Match: both are named.
    expect(recap.awards.find((a) => a.label === 'Most Man of the Match')?.winners).toEqual(['Alex', 'Basil']);
    expect(recap.biggestWin).toEqual({ winner: 'Alex', loser: 'Basil', score: '4-0' });
    expect(recap.biggestRiser?.name).toBe('Alex');
    expect(recap.shareText.split('\n')[0]).toBe('Spring');
    expect(recap.shareText).toContain('🏆 Champion: Alex');
  });

  it('calls an unfinished league a leader, not a champion', () => {
    const recap = buildTournamentRecap({ id: 't', name: 'Spring', format: 'league', status: 'active' }, players, instances, matches, goals);

    expect(recap.decided).toBe(false);
    expect(recap.shareText.split('\n')[0]).toBe('Spring (so far)');
    expect(recap.shareText).toContain('Leader: Alex');
  });
});
