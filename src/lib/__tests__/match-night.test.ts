import { describe, expect, it } from 'vitest';
import { buildHypeLines } from '../hype';
import { buildPunditTable, MODEL_PREDICTOR_ID, modelPicks, outcomeOf } from '../predictions';
import { buildRatingRace } from '../rating-race';
import { buildRecordAlerts } from '../record-alerts';
import { getSeasonKit, SEASON_KITS } from '../season-theme';
import { buildTrophyRoom } from '../trophies';
import type { Match } from '../types';

const players = [
  { id: 'rA', name: 'Alex', base_team: 'A' },
  { id: 'rB', name: 'Basil', base_team: 'B' },
  { id: 'rC', name: 'Cara', base_team: 'C' },
];
const instances = players.map((p) => ({ id: `${p.id}-t`, registered_player_id: p.id, tournament_id: 't', name: p.name, team: 'Team' }));

let n = 0;
function game(home: string, away: string, hs: number, as: number, extra: Partial<Match> = {}): Match {
  n++;
  return {
    id: `m${n}`, tournament_id: 't', home_player_id: `${home}-t`, away_player_id: `${away}-t`,
    home_score: hs, away_score: as, round_number: 1, match_number: n, stage: null, is_played: true, is_bye: false,
    stats: {}, match_order: n, played_at: new Date(Date.UTC(2026, 0, n)).toISOString(), created_at: '', ...extra,
  };
}

describe('hype lines', () => {
  it('finds a head-to-head run, current form and the last meeting', () => {
    const matches = [game('rA', 'rB', 2, 0), game('rB', 'rA', 1, 3), game('rA', 'rB', 4, 1), game('rC', 'rA', 0, 1)];
    const lines = buildHypeLines(players, instances, matches, 'rA', 'rB', { home: 0.7, away: 0.22 });
    const texts = lines.map((line) => line.text);
    expect(texts[0]).toBe('Alex has won the last 3 meetings with Basil.');
    expect(texts).toContain('Alex has won 4 in a row.');
    expect(buildHypeLines(players, instances, matches, 'rA', 'rB', null, 10).map((l) => l.text)).toContain('Last time: Alex won 4–1.');
  });

  it('calls out a first meeting', () => {
    expect(buildHypeLines(players, instances, [], 'rB', 'rC')[0].text).toBe('First ever meeting between Basil and Cara.');
  });
});

describe('record alerts', () => {
  it('flags a run level with the record and milestones close by', () => {
    // Alex won 3, lost, then won 3 again: level with the 3-match record.
    const matches = [
      game('rA', 'rB', 1, 0), game('rA', 'rC', 1, 0), game('rA', 'rB', 1, 0), game('rC', 'rA', 2, 0),
      game('rA', 'rB', 1, 0), game('rA', 'rC', 1, 0), game('rA', 'rB', 1, 0),
    ];
    const alerts = buildRecordAlerts(players, instances, matches, new Map([['rB', 48]]));
    const streak = alerts.find((alert) => alert.kind === 'win-streak' && alert.playerId === 'rA');
    expect(streak?.away).toBe(0);
    expect(streak?.text).toContain('level with the record 3-match winning streak');
    expect(alerts.find((alert) => alert.playerId === 'rB' && alert.kind === 'milestone')?.text).toBe('Basil is 2 goals from 50 career goals.');
  });
});

describe('predictions', () => {
  const matches = [game('rA', 'rB', 3, 0), game('rB', 'rC', 1, 1), game('rC', 'rA', 0, 2)];

  it('scores people and the model on the same matches', () => {
    const model = modelPicks(players, instances, matches, new Set(matches.map((m) => m.id)));
    const table = buildPunditTable([
      { match_id: matches[0].id, predictor_id: 'rB', pick: 'home' },
      { match_id: matches[1].id, predictor_id: 'rB', pick: 'draw' },
      { match_id: matches[1].id, predictor_id: 'rC', pick: 'away' },
    ], matches, new Map(players.map((p) => [p.id, p.name])), model);
    expect(table[0]).toMatchObject({ name: 'Basil', correct: 2, picks: 2 });
    const modelRow = table.find((row) => row.predictorId === MODEL_PREDICTOR_ID)!;
    // Only the two matches someone predicted count for the model.
    expect(modelRow.picks).toBe(2);
    expect(outcomeOf({ home_score: 1, away_score: 1 })).toBe('draw');
  });

  it('has no table until a predicted match is played', () => {
    expect(buildPunditTable([{ match_id: 'unplayed', predictor_id: 'rA', pick: 'home' }], matches, new Map(), new Map())).toEqual([]);
  });
});

describe('trophy room', () => {
  it('lists titles, runner-up finishes and golden boots per tournament', () => {
    const matches = [game('rA', 'rB', 3, 0), game('rB', 'rC', 2, 1), game('rC', 'rA', 0, 1)];
    const tournaments = [{ id: 't', name: 'Season 1', format: 'league' as const, status: 'completed' as 'completed' | 'active', created_at: '2026-01-01' }];
    const goals = [{ player_id: 'rA-t', match_id: matches[0].id }, { player_id: 'rA-t', match_id: matches[0].id }, { player_id: 'rB-t', match_id: matches[1].id }];
    const room = (id: string, list = tournaments) => buildTrophyRoom(id, players, list, instances, matches, goals);
    // Alex won the league, scored most and conceded least.
    expect(room('rA').map((item) => item.kind)).toEqual(['title', 'golden-boot', 'best-defence']);
    expect(room('rA').find((item) => item.kind === 'golden-boot')?.detail).toBe('2 goals');
    // Alex won both matches: a perfect tournament, crowned.
    expect(room('rA')[0]).toMatchObject({ kind: 'title', perfect: true, detail: 'Won the league, winning all 2 matches' });
    expect(room('rB')).toEqual([expect.objectContaining({ kind: 'runner-up', detail: 'Finished second' })]);
    expect(room('rA', [{ ...tournaments[0], status: 'active' }])).toEqual([]);
    // A draw along the way means no crown.
    const drawn = [game('rA', 'rB', 3, 0), game('rB', 'rC', 2, 1), game('rC', 'rA', 1, 1), game('rA', 'rC', 2, 0)];
    const title = buildTrophyRoom('rA', players, tournaments, instances, drawn, []).find((item) => item.kind === 'title');
    expect(title?.perfect).toBeUndefined();
  });
});

describe('rating race', () => {
  it('has a frame per match plus today, and players join as they play', () => {
    const matches = [game('rA', 'rB', 1, 0), game('rA', 'rC', 1, 0)];
    const race = buildRatingRace(players, instances, matches, [{ id: 't', name: 'Season 1' }]);
    expect(race.frames).toHaveLength(3);
    expect(Object.keys(race.frames[0].ratings).sort()).toEqual(['rA', 'rB']);
    expect(race.frames.at(-1)!.label).toBe('Today');
    expect(race.frames.at(-1)!.ratings.rA).toBeGreaterThan(1000);
  });
});

describe('season kits', () => {
  it('rotates numbered seasons through the kits', () => {
    expect(getSeasonKit({ id: 'x', name: 'Season 24' }).name).toBe(SEASON_KITS[0].name);
    expect(getSeasonKit({ id: 'x', name: 'Season 25' }).name).toBe(SEASON_KITS[1].name);
    expect(getSeasonKit({ id: 'abc', name: 'Summer Cup' })).toEqual(getSeasonKit({ id: 'abc', name: 'Summer Cup' }));
  });
});
