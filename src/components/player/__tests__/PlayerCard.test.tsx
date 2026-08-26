import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { CareerStats, RegisteredPlayer } from '@/lib/types';
import PlayerCard from '../PlayerCard';
import { getArchetypeMeta } from '../ArchetypeIcon';

const player: RegisteredPlayer = {
  id: 'player-1',
  name: 'Test Player',
  base_team: 'Test FC',
  created_at: '2026-01-01T00:00:00.000Z',
};

const stats: CareerStats = {
  registered_player_id: player.id,
  player_name: player.name,
  base_team: player.base_team,
  total_matches: 32,
  wins: 23,
  draws: 2,
  losses: 7,
  total_goals: 70,
  total_conceded: 48,
  clean_sheets: 4,
  avg_xg: 1.7,
  avg_rating: 8.4,
  avg_possession: 57,
  motm_awards: 10,
  win_rate: 71.9,
  goals_per_match: 2.19,
};

describe('PlayerCard', () => {
  it('shows leader badges and automatic player tags together', () => {
    const markup = renderToStaticMarkup(
      <PlayerCard player={player} stats={stats} badges={['#1 Goals']} />
    );

    expect(markup).toContain('#1 Goals');
    expect(markup).toContain('xG Beater');
    expect(markup).toContain('Goal Machine');
    expect(markup).toContain('Elite Rated');
  });
});

describe('getArchetypeMeta', () => {
  it.each([
    'Clinical Finisher',
    'Counterpuncher',
    'Iron Curtain',
    'Rating Machine',
    'Relentless Attacker',
  ])('provides dedicated presentation metadata for %s', (archetype) => {
    expect(getArchetypeMeta(archetype).label).toBe(archetype);
  });
});
