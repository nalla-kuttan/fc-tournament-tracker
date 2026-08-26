import { describe, expect, it } from 'vitest';
import { buildRecordContext } from '../context';
import { calculateRivalryRecords } from '../rivalries';
import type { Match, Player, RegisteredPlayer, Tournament } from '@/lib/types';

const registeredPlayers: RegisteredPlayer[] = [
  { id: 'rp-a', name: 'Alex', base_team: 'Chelsea', created_at: '' },
  { id: 'rp-b', name: 'Ruban', base_team: 'Liverpool', created_at: '' },
  { id: 'rp-c', name: 'Moamen', base_team: 'Milan', created_at: '' },
];
const playerInstances: Player[] = registeredPlayers.map((player, index) => ({
  id: `p-${player.id.at(-1)}`,
  tournament_id: 't1',
  registered_player_id: player.id,
  name: player.name,
  team: player.base_team,
  seed: index + 1,
  created_at: '',
}));
const tournaments: Tournament[] = [
  { id: 't1', name: 'League', format: 'league', pin: '', status: 'completed', season_id: 's1', created_at: '' },
];

function match(index: number, home: string, away: string, homeScore: number, awayScore: number): Match {
  return { id: `m-${index}`, tournament_id: 't1', season_id: 's1', home_player_id: `p-${home}`, away_player_id: `p-${away}`, home_score: homeScore, away_score: awayScore, round_number: index, match_number: index, stage: null, is_played: true, is_bye: false, stats: {}, match_order: index, played_at: `2026-01-${String(index).padStart(2, '0')}T12:00:00Z`, created_at: '' };
}

describe('rivalry records', () => {
  it('calculates meetings, dominance, reversals, nemeses, and closest pair', () => {
    const matches = [
      match(1, 'a', 'b', 0, 2),
      match(2, 'a', 'b', 2, 1),
      match(3, 'a', 'b', 3, 2),
      match(4, 'a', 'b', 1, 1),
      match(5, 'a', 'b', 0, 1),
      match(6, 'a', 'b', 1, 2),
      match(7, 'a', 'c', 5, 0),
      match(8, 'a', 'c', 4, 0),
      match(9, 'a', 'c', 6, 1),
      match(10, 'a', 'c', 5, 1),
      match(11, 'a', 'c', 7, 0),
    ];
    const context = buildRecordContext(registeredPlayers, playerInstances, tournaments, matches, { scope: 'all-time' });
    const records = calculateRivalryRecords(context);

    expect(records.mostPlayed[0]).toMatchObject({ playerName: 'Alex', opponentName: 'Ruban', value: 6, meetings: 6 });
    expect(records.dominance[0]).toMatchObject({ playerName: 'Alex', opponentName: 'Moamen', value: 100, wins: 5 });
    expect(records.reversals[0]).toMatchObject({ playerName: 'Alex', opponentName: 'Ruban', value: 1 });
    expect(records.nemesisIndex.find((row) => row.playerName === 'Alex')).toMatchObject({ opponentName: 'Ruban', value: 100 });
    expect(records.closest[0]).toMatchObject({ playerName: 'Alex', opponentName: 'Ruban', meetings: 6 });
  });

  it('requires five direct meetings', () => {
    const context = buildRecordContext(registeredPlayers, playerInstances, tournaments, [
      match(1, 'a', 'b', 1, 0),
      match(2, 'a', 'b', 1, 0),
      match(3, 'a', 'b', 1, 0),
      match(4, 'a', 'b', 1, 0),
    ], { scope: 'all-time' });
    const records = calculateRivalryRecords(context);
    expect(records.mostPlayed).toEqual([]);
    expect(records.dominance).toEqual([]);
    expect(records.closest).toEqual([]);
  });
});
