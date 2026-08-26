import { describe, expect, it } from 'vitest';
import {
  buildCompetitiveRatingTimeline,
  buildTournamentDerivedSeasons,
  calculateCompetitiveRatings,
  calculateCompetitiveRecords,
  getMatchIntelligenceLabels,
} from '../competitive';
import type { Match, Player, RegisteredPlayer, Tournament } from '../types';

const players: RegisteredPlayer[] = [
  { id: 'rp-a', name: 'Ayaan', base_team: 'Arsenal', created_at: '2026-01-01T00:00:00Z' },
  { id: 'rp-b', name: 'Bilal', base_team: 'Barcelona', created_at: '2026-01-01T00:00:00Z' },
  { id: 'rp-c', name: 'Cyrus', base_team: 'City', created_at: '2026-01-01T00:00:00Z' },
];

const playerInstances: Pick<Player, 'id' | 'registered_player_id' | 'name' | 'team' | 'tournament_id'>[] = [
  { id: 'p-a-s1', registered_player_id: 'rp-a', name: 'Ayaan', team: 'Arsenal', tournament_id: 't-one' },
  { id: 'p-b-s1', registered_player_id: 'rp-b', name: 'Bilal', team: 'Barcelona', tournament_id: 't-one' },
  { id: 'p-c-s1', registered_player_id: 'rp-c', name: 'Cyrus', team: 'City', tournament_id: 't-one' },
  { id: 'p-a-s2', registered_player_id: 'rp-a', name: 'Ayaan', team: 'France', tournament_id: 't-two' },
  { id: 'p-b-s2', registered_player_id: 'rp-b', name: 'Bilal', team: 'Brazil', tournament_id: 't-two' },
];

const tournaments: Array<Tournament & { season_id?: string | null }> = [
  {
    id: 't-one',
    name: 'Friday League',
    format: 'league',
    pin: 'hash',
    status: 'completed',
    created_at: '2026-02-01T00:00:00Z',
    season_id: null,
  },
  {
    id: 't-two',
    name: 'Saturday Cup',
    format: 'knockout',
    pin: 'hash',
    status: 'active',
    created_at: '2026-03-01T00:00:00Z',
    season_id: null,
  },
];

const matches: Match[] = [
  {
    id: 'm-1',
    tournament_id: 't-one',
    season_id: 'season-t-one',
    home_player_id: 'p-a-s1',
    away_player_id: 'p-b-s1',
    home_score: 1,
    away_score: 4,
    round_number: 1,
    match_number: 1,
    stage: null,
    is_played: true,
    is_bye: false,
    stats: { home_xg: 2.4, away_xg: 1.1, home_rating: 6.2, away_rating: 8.8, motm_player_id: 'p-b-s1', motm_rating: 9.3 },
    match_order: 1,
    played_at: '2026-02-01T20:00:00Z',
    created_at: '2026-02-01T19:00:00Z',
    home_player: { id: 'p-a-s1', tournament_id: 't-one', registered_player_id: 'rp-a', name: 'Ayaan', team: 'Arsenal', seed: 1, created_at: '' },
    away_player: { id: 'p-b-s1', tournament_id: 't-one', registered_player_id: 'rp-b', name: 'Bilal', team: 'Barcelona', seed: 2, created_at: '' },
  },
  {
    id: 'm-2',
    tournament_id: 't-one',
    season_id: 'season-t-one',
    home_player_id: 'p-a-s1',
    away_player_id: 'p-c-s1',
    home_score: 3,
    away_score: 2,
    round_number: 2,
    match_number: 2,
    stage: null,
    is_played: true,
    is_bye: false,
    stats: { home_rating: 8.1, away_rating: 7.3 },
    match_order: 2,
    played_at: '2026-02-02T20:00:00Z',
    created_at: '2026-02-02T19:00:00Z',
    home_player: { id: 'p-a-s1', tournament_id: 't-one', registered_player_id: 'rp-a', name: 'Ayaan', team: 'Arsenal', seed: 1, created_at: '' },
    away_player: { id: 'p-c-s1', tournament_id: 't-one', registered_player_id: 'rp-c', name: 'Cyrus', team: 'City', seed: 3, created_at: '' },
  },
  {
    id: 'm-3',
    tournament_id: 't-two',
    season_id: 'season-t-two',
    home_player_id: 'p-a-s2',
    away_player_id: 'p-b-s2',
    home_score: 5,
    away_score: 0,
    round_number: 1,
    match_number: 1,
    stage: 'F',
    is_played: true,
    is_bye: false,
    stats: { home_rating: 9.1, away_rating: 5.2, motm_player_id: 'p-a-s2', motm_rating: 9.7 },
    match_order: 1,
    played_at: '2026-03-01T20:00:00Z',
    created_at: '2026-03-01T19:00:00Z',
    home_player: { id: 'p-a-s2', tournament_id: 't-two', registered_player_id: 'rp-a', name: 'Ayaan', team: 'France', seed: 1, created_at: '' },
    away_player: { id: 'p-b-s2', tournament_id: 't-two', registered_player_id: 'rp-b', name: 'Bilal', team: 'Brazil', seed: 2, created_at: '' },
  },
];

describe('competitive helpers', () => {
  it('builds one historical season per existing tournament without a season id', () => {
    const { seasons, tournamentSeasonAssignments } = buildTournamentDerivedSeasons(tournaments);

    expect(seasons).toHaveLength(2);
    expect(seasons[0]).toMatchObject({
      id: 'season-t-one',
      name: 'Friday League',
      status: 'completed',
      source_tournament_id: 't-one',
    });
    expect(seasons[1]).toMatchObject({
      id: 'season-t-two',
      name: 'Saturday Cup',
      status: 'active',
      source_tournament_id: 't-two',
    });
    expect(tournamentSeasonAssignments).toEqual([
      { tournamentId: 't-one', seasonId: 'season-t-one' },
      { tournamentId: 't-two', seasonId: 'season-t-two' },
    ]);
  });

  it('calculates all-time and season ratings with movement, peak, and recent form', () => {
    const allTime = calculateCompetitiveRatings(players, playerInstances, matches, { scope: 'all-time' });
    const seasonOnly = calculateCompetitiveRatings(players, playerInstances, matches, {
      scope: 'season',
      seasonId: 'season-t-two',
    });

    expect(allTime[0].player.id).toBe('rp-a');
    expect(allTime[0].rating).toBeGreaterThan(1000);
    expect(allTime[0].peakRating).toBeGreaterThanOrEqual(allTime[0].rating);
    expect(allTime.find((row) => row.player.id === 'rp-b')?.recentForm).toEqual(['L', 'W']);
    expect(seasonOnly).toHaveLength(2);
    expect(seasonOnly[0]).toMatchObject({
      player: expect.objectContaining({ id: 'rp-a' }),
      rank: 1,
      recentForm: ['W'],
      matches: 1,
    });
  });

  it('captures ratings before each match without future leakage', () => {
    const timeline = buildCompetitiveRatingTimeline(players, playerInstances, matches, { scope: 'all-time' });

    expect(timeline.get('m-1')).toMatchObject({
      homeRegisteredPlayerId: 'rp-a',
      awayRegisteredPlayerId: 'rp-b',
      homeRating: 1000,
      awayRating: 1000,
    });
    expect(timeline.get('m-2')?.homeRating).toBeLessThan(1000);
    expect(timeline.get('m-2')?.awayRating).toBe(1000);
    expect(timeline.get('m-3')?.homeRating).not.toBe(1000);
    expect(timeline.get('m-3')?.awayRating).not.toBe(1000);
  });

  it('calculates trophy and record rows across season and all-time scopes', () => {
    const records = calculateCompetitiveRecords(players, playerInstances, tournaments, matches, {
      scope: 'all-time',
    });

    expect(records.trophyCabinet.find((row) => row.player.id === 'rp-a')).toMatchObject({
      titles: 1,
      finals: 1,
    });
    expect(records.biggestWins[0]).toMatchObject({
      playerName: 'Ayaan',
      scoreline: '5-0',
      goalDifference: 5,
    });
    expect(records.longestWinStreaks[0]).toMatchObject({
      playerName: 'Ayaan',
      streak: 2,
    });
    expect(records.biggestUpsets[0].winnerName).toBe('Bilal');
    expect(records.topScorers[0]).toMatchObject({ playerName: 'Ayaan', value: 9 });
    expect(records.mostWins[0]).toMatchObject({ playerName: 'Ayaan', value: 2 });
    expect(records.bestAttacks[0]).toMatchObject({ playerName: 'Ayaan', value: 9 });
    expect(records.bestDefenses[0]).toMatchObject({ playerName: 'Cyrus', value: 3 });
    expect(records.cleanSheetKings[0]).toMatchObject({ playerName: 'Ayaan', value: 1 });
    expect(records.clutchWins[0]).toMatchObject({ playerName: 'Ayaan', value: 1 });
    expect(records.highestScoringMatches[0]).toMatchObject({ scoreline: '1-4', totalGoals: 5 });
    expect(records.bestIndividualSeasons.mostGoals[0]).toMatchObject({
      playerName: 'Ayaan',
      seasonName: 'Saturday Cup',
      value: 5,
    });
    expect(records.bestIndividualSeasons.bestWinRates[0]).toMatchObject({
      playerName: 'Ayaan',
      seasonName: 'Friday League',
      value: 50,
    });
    expect(records.expanded.runs.bestMatchOutput[0]).toMatchObject({ playerName: 'Ayaan', value: 5 });
    expect(records.expanded.campaigns.bestGoalDifference).toEqual([]);
    expect(records.expanded).toHaveProperty('performance');
    expect(records.expanded).toHaveProperty('rivalries');
    expect(records.expanded).toHaveProperty('teams');
  });

  it('labels comeback, upset, defensive, goal rush, and rivalry swing matches', () => {
    const labels = getMatchIntelligenceLabels(matches[0], {
      winnerRating: 970,
      loserRating: 1040,
      previousH2HWinnerId: 'p-a-s1',
    });

    expect(labels.map((label) => label.kind)).toEqual(
      expect.arrayContaining(['upset', 'defensive-masterclass', 'goal-rush', 'rivalry-swing'])
    );
  });
});
