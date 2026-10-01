import { describe, expect, it } from 'vitest';
import { withMovement } from '../algorithms/standings';
import { clubCode, getClubBadge } from '../club-badge';
import { buildPlayerCards, overallFromRating, tierFor } from '../player-cards';
import { buildTournamentWrapped } from '../tournament-wrapped';
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
  game('rA', 'rB', 4, 0, { home_team: 'Real Madrid', away_team: 'Arsenal', motm_player_id: 'rA-t' }),
  game('rB', 'rC', 2, 1, { home_team: 'Arsenal', away_team: 'Chelsea' }),
  game('rC', 'rA', 1, 1, { home_team: 'Chelsea', away_team: 'Real Madrid' }),
  game('rC', 'rB', 3, 0, { home_team: 'Chelsea', away_team: 'Arsenal' }),
];
const tournaments = [{ id: 't', name: 'Spring', format: 'league' as const, status: 'completed' as const, created_at: '2026-01-01' }];

describe('player cards', () => {
  const cards = buildPlayerCards(players, instances, matches, tournaments);

  it('maps rating to a 70–99 overall and a tier', () => {
    expect(overallFromRating(880)).toBe(70);
    expect(overallFromRating(1000)).toBe(84);
    expect(overallFromRating(1127)).toBe(99);
    expect(overallFromRating(5000)).toBe(99);
    expect(overallFromRating(0)).toBe(70);
    expect([tierFor(90), tierFor(82), tierFor(76), tierFor(75)]).toEqual(['elite', 'gold', 'silver', 'bronze']);
  });

  it('gives every player six attributes within range and ranks by rating', () => {
    expect(cards.map((card) => card.name)).toEqual(['Alex', 'Cara', 'Basil']);
    for (const card of cards) {
      expect(card.attributes.map((a) => a.key)).toEqual(['ATT', 'DEF', 'WIN', 'MOM', 'FRM', 'CLU']);
      for (const attribute of card.attributes) expect(attribute.value).toBeGreaterThanOrEqual(40);
    }
  });

  it('marks the reigning champion, titles, favourite club and small samples', () => {
    const alex = cards.find((card) => card.name === 'Alex')!;
    expect(alex).toMatchObject({ reigningChampion: true, titles: 1, club: 'Real Madrid', provisional: true, matches: 2 });
    expect(cards.filter((card) => card.reigningChampion)).toHaveLength(1);
    // Basil conceded the most per match, so has the lowest defence.
    const defence = (name: string) => cards.find((card) => card.name === name)!.attributes.find((a) => a.key === 'DEF')!.value;
    expect(defence('Basil')).toBeLessThan(defence('Alex'));
  });
});

describe('Wrapped', () => {
  const wrapped = buildTournamentWrapped(tournaments[0], players, instances, matches, [
    { player_id: 'rA-t', match_id: 'm1' }, { player_id: 'rA-t', match_id: 'm1' },
    { player_id: 'rC-t', match_id: 'm4' },
  ]);

  it('tells each player where they finished and their best night', () => {
    const [first, , third] = wrapped.players;
    expect(first).toMatchObject({ name: 'Alex', position: 1, entrants: 3, goals: 2, goalsRank: 1, bestWin: { opponent: 'Basil', score: '4–0', margin: 4 } });
    expect(third.name).toBe('Basil');
  });

  it('finds the nemesis and the most-played club', () => {
    const basil = wrapped.players.find((player) => player.name === 'Basil')!;
    // Basil took nothing off Alex, but beat Cara once.
    expect(basil.nemesis?.opponent).toBe('Alex');
    expect(basil.favouriteOpponent).toMatchObject({ opponent: 'Cara', wins: 1, losses: 1 });
    expect(basil.club).toEqual({ name: 'Arsenal', matches: 3 });
    expect(wrapped.players.find((player) => player.name === 'Alex')!.nemesis).toBeNull();
  });
});

describe('club badges', () => {
  it('uses known colours and falls back to stable generated ones', () => {
    expect(getClubBadge('Real Madrid')).toMatchObject({ code: 'RMA', primary: '#F4F1E8', text: '#16090D' });
    expect(getClubBadge('Lakeside Rovers')).toEqual(getClubBadge('Lakeside Rovers'));
    expect(getClubBadge('Lakeside Rovers').code).toBe('LR');
    expect(clubCode('FC Heidenheim')).toBe('HEI');
    expect(getClubBadge(null).code).toBe('?');
  });
});

describe('standings movement', () => {
  it('records each position before the latest result', () => {
    const table = withMovement(matches, instances.map((i) => ({ id: i.id, name: i.name, team: i.team })));
    // Cara's 3–0 over Basil (the latest match) lifts her from 3rd to 2nd.
    expect(table.map((row) => [row.player_name, row.previous_position])).toEqual([['Alex', 1], ['Cara', 3], ['Basil', 2]]);
  });
});
