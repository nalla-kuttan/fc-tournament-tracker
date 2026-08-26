import { describe, expect, it } from 'vitest';
import { buildRecordContext } from '../context';
import { calculateTeamRecords } from '../teams';
import type { Match, Player, RegisteredPlayer, Tournament } from '@/lib/types';

const registeredPlayers: RegisteredPlayer[] = [
  { id: 'rp-a', name: 'Alex', base_team: 'Chelsea', created_at: '' },
  { id: 'rp-b', name: 'Ruban', base_team: 'Liverpool', created_at: '' },
];
const playerInstances: Player[] = [
  { id: 'p-a1', tournament_id: 't1', registered_player_id: 'rp-a', name: 'Alex', team: 'Chelsea', seed: 1, created_at: '' },
  { id: 'p-b1', tournament_id: 't1', registered_player_id: 'rp-b', name: 'Ruban', team: 'Liverpool', seed: 2, created_at: '' },
  { id: 'p-a2', tournament_id: 't2', registered_player_id: 'rp-a', name: 'Alex', team: 'Spain', seed: 1, created_at: '' },
  { id: 'p-b2', tournament_id: 't2', registered_player_id: 'rp-b', name: 'Ruban', team: 'France', seed: 2, created_at: '' },
];
const tournaments: Tournament[] = [
  { id: 't1', name: 'League 1', format: 'league', pin: '', status: 'completed', season_id: 's1', created_at: '' },
  { id: 't2', name: 'League 2', format: 'league', pin: '', status: 'completed', season_id: 's2', created_at: '' },
];
function match(index: number, tournament: '1' | '2', alexWins: boolean): Match {
  return { id: `m-${tournament}-${index}`, tournament_id: `t${tournament}`, season_id: `s${tournament}`, home_player_id: `p-a${tournament}`, away_player_id: `p-b${tournament}`, home_score: alexWins ? 3 : 0, away_score: alexWins ? 1 : 2, round_number: index, match_number: index, stage: null, is_played: true, is_bye: false, stats: {}, match_order: index, played_at: `2026-0${tournament}-${String(index).padStart(2, '0')}T12:00:00Z`, created_at: '' };
}

describe('team records', () => {
  it('ranks specialists, combinations, and winning versatility from selected teams', () => {
    const matches = [
      ...Array.from({ length: 8 }, (_, index) => match(index + 1, '1', index < 6)),
      ...Array.from({ length: 8 }, (_, index) => match(index + 1, '2', true)),
    ];
    const context = buildRecordContext(registeredPlayers, playerInstances, tournaments, matches, { scope: 'all-time' });
    const records = calculateTeamRecords(context);

    expect(records.clubSpecialists[0]).toMatchObject({ playerName: 'Alex', team: 'Spain', value: 100, sampleSize: 8 });
    expect(records.bestCombinations[0]).toMatchObject({ playerName: 'Alex', team: 'Spain', value: 100, wins: 8 });
    expect(records.versatileWinners[0]).toMatchObject({ playerName: 'Alex', value: 2 });
  });

  it('does not rank a player-team combination below eight matches', () => {
    const matches = Array.from({ length: 7 }, (_, index) => match(index + 1, '1', true));
    const context = buildRecordContext(registeredPlayers, playerInstances, tournaments, matches, { scope: 'all-time' });
    const records = calculateTeamRecords(context);
    expect(records.clubSpecialists).toEqual([]);
    expect(records.bestCombinations).toEqual([]);
    expect(records.versatileWinners[0]).toMatchObject({ playerName: 'Alex', value: 1 });
  });
});
