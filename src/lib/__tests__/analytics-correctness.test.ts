import { describe, expect, it } from 'vitest';
import { computeFunFacts } from '@/components/analytics/FunFactsSection';
import { getLeagueStory, getPowerRankings, getTitleRace, getUpsets } from '../analytics-insights';
import { buildCompetitiveRatingTimeline, calculateCompetitiveRatings, calculateCompetitiveRecords } from '../competitive';
import type { Match, Tournament } from '../types';

// Three players; each has one instance per tournament.
const players = [
  { id: 'rA', name: 'Alex', base_team: 'A FC' },
  { id: 'rB', name: 'Basil', base_team: 'B FC' },
  { id: 'rC', name: 'Cara', base_team: 'C FC' },
  { id: 'rD', name: 'Dev', base_team: 'D FC' },
];
const instance = (registered: string, tournament: string) => ({
  id: `${registered}-${tournament}`, registered_player_id: registered, tournament_id: tournament,
  name: players.find((p) => p.id === registered)!.name, team: 'Team',
});
const instances = ['t1', 't2'].flatMap((t) => players.map((p) => instance(p.id, t)));

let order = 0;
function match(tournament: string, home: string, away: string, homeScore: number, awayScore: number, extra: Partial<Match> = {}): Match {
  order++;
  return {
    id: `m${order}`, tournament_id: tournament, season_id: `season-${tournament}`,
    home_player_id: `${home}-${tournament}`, away_player_id: `${away}-${tournament}`,
    home_score: homeScore, away_score: awayScore, round_number: 1, match_number: order, stage: null,
    is_played: true, is_bye: false, stats: {}, match_order: order,
    played_at: new Date(Date.UTC(2026, 0, order)).toISOString(), created_at: '',
    home_player: { id: `${home}-${tournament}`, name: players.find((p) => p.id === home)!.name, team: 'Team' } as never,
    away_player: { id: `${away}-${tournament}`, name: players.find((p) => p.id === away)!.name, team: 'Team' } as never,
    ...extra,
  };
}

const tournament = (id: string, status: Tournament['status']) => ({
  id, name: id, format: 'league' as const, status, created_at: '2026-01-01', season_id: null,
});

describe('ratings', () => {
  it('reports the real change from the latest match, not a fixed ±18', () => {
    const matches = [match('t1', 'rA', 'rB', 3, 0), match('t1', 'rA', 'rC', 5, 0)];
    const before = buildCompetitiveRatingTimeline(players, instances, matches, { scope: 'all-time' }).get(matches[1].id)!;
    const alex = calculateCompetitiveRatings(players, instances, matches, { scope: 'all-time' }).find((r) => r.player.id === 'rA')!;

    expect(alex.previousRating).toBe(before.homeRating);
    expect(alex.movement).toBe(alex.rating - before.homeRating);
  });

  it('uses one rating for the power table and the competition history', () => {
    const matches = [match('t1', 'rA', 'rB', 2, 1), match('t1', 'rB', 'rC', 4, 0), match('t1', 'rC', 'rA', 1, 1)];
    const power = getPowerRankings(players, instances, matches);
    const history = calculateCompetitiveRatings(players, instances, matches, { scope: 'all-time' });

    for (const row of history) {
      expect(power.find((p) => p.player.id === row.player.id)?.rating).toBe(row.rating);
    }
  });
});

describe('upsets', () => {
  // Cara loses twice, then beats Alex, who was rated far higher at the time.
  const matches = [
    match('t1', 'rA', 'rC', 5, 0),
    match('t1', 'rB', 'rC', 4, 0),
    match('t1', 'rC', 'rA', 2, 1),
    match('t1', 'rA', 'rB', 1, 0),
  ];

  it('are judged by the ratings going into the match', () => {
    const timeline = buildCompetitiveRatingTimeline(players, instances, matches, { scope: 'all-time' });
    const upsets = getUpsets(matches, players, instances);

    expect(upsets[0]).toMatchObject({ winnerName: 'Cara', loserName: 'Alex' });
    for (const row of upsets) {
      const before = timeline.get(row.match.id)!;
      expect([before.homeRating, before.awayRating]).toEqual(expect.arrayContaining([row.winnerRating, row.loserRating]));
      expect(row.winnerRating).toBeLessThan(row.loserRating);
    }
  });

  it('are never a favourite winning big', () => {
    const records = calculateCompetitiveRecords(players, instances, [tournament('t1', 'completed')], matches, { scope: 'all-time' });

    // Alex's 5-0 and Basil's 4-0 were favourites winning (or level ratings), so they aren't upsets.
    expect(records.biggestUpsets[0]).toMatchObject({ winnerName: 'Cara', loserName: 'Alex' });
    expect(records.biggestUpsets.some((row) => row.matchId === matches[0].id || row.matchId === matches[1].id)).toBe(false);
  });
});

describe('trophy cabinet', () => {
  it('only awards a league title once the tournament is completed', () => {
    const matches = [match('t1', 'rA', 'rB', 2, 0), match('t1', 'rA', 'rC', 2, 0), match('t2', 'rB', 'rA', 3, 0)];
    const records = calculateCompetitiveRecords(
      players, instances, [tournament('t1', 'completed'), tournament('t2', 'active')], matches, { scope: 'all-time' }
    );

    expect(records.trophyCabinet.find((row) => row.player.id === 'rA')?.titles).toBe(1);
    expect(records.trophyCabinet.find((row) => row.player.id === 'rB')?.titles ?? 0).toBe(0);
  });

  it('breaks a level table the same way the standings do (head-to-head)', () => {
    // Alex and Basil both finish on 6 points, +3, 4 scored; Basil beat Alex.
    const matches = [
      match('t1', 'rB', 'rA', 1, 0), match('t1', 'rA', 'rC', 2, 0), match('t1', 'rA', 'rD', 2, 0),
      match('t1', 'rB', 'rC', 3, 0), match('t1', 'rD', 'rB', 1, 0),
    ];
    const records = calculateCompetitiveRecords(players, instances, [tournament('t1', 'completed')], matches, { scope: 'all-time' });

    expect(records.trophyCabinet.find((row) => row.titles === 1)?.player.name).toBe('Basil');
  });
});

describe('attack and defence records', () => {
  it('rank per match and ignore tiny samples', () => {
    const matches = [
      match('t1', 'rA', 'rB', 1, 1), match('t1', 'rA', 'rB', 1, 1), match('t1', 'rA', 'rB', 1, 1),
      match('t1', 'rC', 'rA', 5, 0),
    ];
    const records = calculateCompetitiveRecords(players, instances, [tournament('t1', 'completed')], matches, { scope: 'all-time' });

    // Basil: 3 conceded in 3 (1.00); Alex: 8 conceded in 4 (2.00); Cara has one match.
    expect(records.bestDefenses.map((row) => [row.playerName, row.value])).toEqual([['Basil', 1], ['Alex', 2]]);
    expect(records.bestAttacks.map((row) => row.playerName)).not.toContain('Cara');
  });
});

describe('tournament story', () => {
  it('names the champion in league-table order, not by points alone', () => {
    const tableOrder = [
      { player_name: 'Basil', team: 'B', points: 9, goals_from_score: 6, conceded: 2, played: 4 },
      { player_name: 'Alex', team: 'A', points: 9, goals_from_score: 9, conceded: 3, played: 4 },
    ];
    expect(getLeagueStory(tableOrder, []).champion).toBe('Basil');
  });

  it('projects the title race from fixtures actually left', () => {
    const rows = [{ player_name: 'Alex', team: 'A', points: 6, played: 2, win_rate: 100, remaining: 2 }];
    expect(getTitleRace(rows, { format: 'league' })[0]).toMatchObject({ remainingMatches: 2, projectedPoints: 12 });
  });
});

describe('club records', () => {
  it('count Man of the Match awards across a whole career', () => {
    const matches = [
      match('t1', 'rA', 'rB', 1, 0, { stats: { motm_player_id: 'rA-t1' } }),
      match('t1', 'rB', 'rC', 1, 0, { stats: { motm_player_id: 'rB-t1' } }),
      match('t2', 'rA', 'rC', 1, 0, { stats: { motm_player_id: 'rA-t2' } }),
    ];
    const facts = computeFunFacts(matches, [], players as never, instances as never);

    expect(facts.find((fact) => fact.title === 'Most Man of the Match awards')).toMatchObject({ value: '2 awards', subtitle: 'Alex' });
  });
});
