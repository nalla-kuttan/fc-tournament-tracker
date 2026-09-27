import { describe, expect, it } from 'vitest';
import {
  getChampionName,
  getMatchNightState,
  newTournamentHref,
  pickFeaturedTournament,
  suggestNextName,
} from '../season-status';

const tournament = (id: string, status: 'draft' | 'active' | 'completed', created_at: string, overrides = {}) => ({
  id, name: `Season ${id}`, format: 'league' as const, status, created_at, ...overrides,
});

const fixture = (id: string, overrides: Record<string, unknown> = {}) => ({
  id, is_played: false, is_bye: false, home_player_id: 'a', away_player_id: 'b', ...overrides,
});

describe('featured tournament', () => {
  it('prefers the active tournament, then a draft, then the newest', () => {
    const done = tournament('24', 'completed', '2026-09-26');
    const draft = tournament('25', 'draft', '2026-09-27');
    const active = tournament('23', 'active', '2026-08-30');

    expect(pickFeaturedTournament([done, draft, active])?.id).toBe('23');
    expect(pickFeaturedTournament([done, draft])?.id).toBe('25');
    expect(pickFeaturedTournament([tournament('1', 'completed', '2026-01-01'), done])?.id).toBe('24');
    expect(pickFeaturedTournament([])).toBeNull();
  });
});

describe('match-night state', () => {
  const active = tournament('24', 'active', '2026-09-26');

  it('offers the next playable fixture', () => {
    const state = getMatchNightState(active, [fixture('m1', { is_played: true }), fixture('bye', { is_bye: true }), fixture('m2')], []);

    expect(state.kind).toBe('next-match');
    expect(state.kind === 'next-match' && state.match.id).toBe('m2');
  });

  it('waits when the remaining fixtures have no players yet', () => {
    expect(getMatchNightState(active, [fixture('m1', { is_played: true }), fixture('final', { away_player_id: null })], []).kind)
      .toBe('awaiting-fixture');
  });

  it('asks to close a tournament once every fixture is recorded', () => {
    expect(getMatchNightState(active, [fixture('m1', { is_played: true })], []).kind).toBe('awaiting-close');
  });

  it('asks for a schedule when nothing is generated', () => {
    expect(getMatchNightState(active, [], []).kind).toBe('awaiting-schedule');
    expect(getMatchNightState(tournament('25', 'draft', '2026-09-27'), undefined, []).kind).toBe('awaiting-schedule');
  });

  it('does not guess while fixtures are loading', () => {
    expect(getMatchNightState(active, undefined, []).kind).toBe('loading');
  });

  it('celebrates the champion of a completed tournament and suggests the next one', () => {
    const done = tournament('24', 'completed', '2026-09-26');
    const champion = { tournament_id: '24', winner_name: 'Ruban', winner_team: 'Barcelona', stats: { points: 12 } };

    expect(getMatchNightState(done, [], [champion])).toEqual({ kind: 'complete', tournament: done, champion, nextName: 'Season 25' });
    expect(getMatchNightState(done, [], [])).toMatchObject({ kind: 'complete', champion: null });
  });
});

describe('next tournament', () => {
  it('increments a trailing number', () => {
    expect(suggestNextName('Season 24')).toBe('Season 25');
    expect(suggestNextName('Summer Cup 9 ')).toBe('Summer Cup 10');
    expect(suggestNextName('World Cup')).toBe('');
  });

  it('links to a prefilled create form', () => {
    expect(newTournamentHref({ id: 't1', format: 'league' }, 'Season 25'))
      .toBe('/tournaments/new?from=t1&format=league&name=Season+25');
    expect(newTournamentHref({ id: 't1', format: 'cup' }, '')).toBe('/tournaments/new?from=t1&format=cup');
  });
});

describe('champion name', () => {
  it('uses the league leader', () => {
    expect(getChampionName('league', [{ player_name: 'Ruban' }, { player_name: 'Alex' }], [])).toBe('Ruban');
  });

  it('uses the knockout final winner, and nobody for a drawn or missing final', () => {
    const final = { stage: 'F', is_played: true, home_score: 1, away_score: 3, home_player: { name: 'Alex' }, away_player: { name: 'Basil' } };

    expect(getChampionName('knockout', [], [final])).toBe('Basil');
    expect(getChampionName('knockout', [], [{ ...final, away_score: 1 }])).toBeNull();
    expect(getChampionName('knockout', [], [])).toBeNull();
  });
});
