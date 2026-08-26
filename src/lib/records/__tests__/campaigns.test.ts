import { describe, expect, it } from 'vitest';
import { buildRecordContext } from '../context';
import { calculateCampaignRecords } from '../campaigns';
import type { Match, Player, RegisteredPlayer, Tournament } from '@/lib/types';

const people: RegisteredPlayer[] = ['Ruban', 'Alex', 'Basil'].map((name, index) => ({
  id: `rp-${name.toLowerCase()}`,
  name,
  base_team: name === 'Ruban' ? 'Chelsea' : name === 'Alex' ? 'Spain' : 'Liverpool',
  created_at: `2026-01-0${index + 1}T00:00:00Z`,
}));

const tournaments: Tournament[] = [
  { id: 't1', name: 'Season 1', format: 'league', pin: '', status: 'completed', season_id: 's1', created_at: '2026-01-01T00:00:00Z' },
  { id: 't2', name: 'Season 2', format: 'league', pin: '', status: 'completed', season_id: 's2', created_at: '2026-02-01T00:00:00Z' },
  { id: 't3', name: 'Active Season', format: 'league', pin: '', status: 'active', season_id: 's3', created_at: '2026-03-01T00:00:00Z' },
];

const instances: Player[] = tournaments.flatMap((tournament) => people.map((person, index) => ({
  id: `${tournament.id}-${person.id}`,
  tournament_id: tournament.id,
  registered_player_id: person.id,
  name: person.name,
  team: person.base_team,
  seed: index + 1,
  created_at: tournament.created_at,
})));

function game(id: string, tournamentId: string, home: string, away: string, homeScore: number, awayScore: number, order: number): Match {
  return {
    id,
    tournament_id: tournamentId,
    season_id: `s${tournamentId.slice(1)}`,
    home_player_id: `${tournamentId}-rp-${home.toLowerCase()}`,
    away_player_id: `${tournamentId}-rp-${away.toLowerCase()}`,
    home_score: homeScore,
    away_score: awayScore,
    round_number: order,
    match_number: order,
    stage: null,
    is_played: true,
    is_bye: false,
    stats: {},
    match_order: order,
    played_at: `2026-0${tournamentId.slice(1)}-${String(order).padStart(2, '0')}T12:00:00Z`,
    created_at: `2026-0${tournamentId.slice(1)}-${String(order).padStart(2, '0')}T12:00:00Z`,
  };
}

const matches: Match[] = [
  game('m1', 't1', 'Ruban', 'Alex', 3, 0, 1),
  game('m2', 't1', 'Ruban', 'Basil', 2, 0, 2),
  game('m3', 't1', 'Alex', 'Ruban', 0, 2, 3),
  game('m4', 't1', 'Basil', 'Ruban', 0, 3, 4),
  game('m5', 't1', 'Alex', 'Basil', 1, 1, 5),
  game('m6', 't1', 'Basil', 'Alex', 1, 2, 6),
  game('m7', 't2', 'Basil', 'Alex', 1, 1, 1),
  game('m8', 't2', 'Basil', 'Alex', 2, 1, 2),
  game('m9', 't2', 'Alex', 'Basil', 0, 1, 3),
  game('m10', 't3', 'Alex', 'Ruban', 2, 0, 1),
  game('m11', 't3', 'Alex', 'Basil', 2, 0, 2),
  game('m12', 't3', 'Alex', 'Ruban', 3, 0, 3),
];

describe('campaign records', () => {
  it('ranks completed perfect, unbeaten, goal-difference, and league title-margin campaigns', () => {
    const context = buildRecordContext(people, instances, tournaments, matches, { scope: 'all-time' });
    const records = calculateCampaignRecords(context);

    expect(records.perfectCampaigns[0]).toMatchObject({ playerName: 'Ruban', tournamentName: 'Season 1', value: 4 });
    expect(records.unbeatenCampaigns).toEqual(expect.arrayContaining([
      expect.objectContaining({ playerName: 'Basil', tournamentName: 'Season 2', detail: expect.stringContaining('2-1-0') }),
    ]));
    expect(records.bestGoalDifference[0]).toMatchObject({ playerName: 'Ruban', value: 10 });
    expect(records.largestTitleMargins[0]).toMatchObject({ playerName: 'Ruban', value: 8 });
  });

  it('excludes active and shorter-than-three-match campaigns', () => {
    const records = calculateCampaignRecords(buildRecordContext(people, instances, tournaments, matches, { scope: 'all-time' }));
    const all = [...records.perfectCampaigns, ...records.unbeatenCampaigns, ...records.bestGoalDifference];

    expect(all.some((row) => row.tournamentName === 'Active Season')).toBe(false);
    expect(all.some((row) => row.playerName === 'Alex' && row.tournamentName === 'Season 1')).toBe(true);
    expect(all.some((row) => row.playerName === 'Alex' && row.tournamentName === 'Season 2')).toBe(true);
  });
});
