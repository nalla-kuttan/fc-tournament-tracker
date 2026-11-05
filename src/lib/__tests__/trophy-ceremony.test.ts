import { describe, expect, it } from 'vitest';
import { buildCeremony } from '../trophies';

const row = (player_name: string, points: number, wins: number, draws: number, losses: number) => ({ player_name, points, wins, draws, losses, goal_difference: 0 });

const recap = {
  decided: true,
  champion: 'Alex',
  tournament: { id: 't', name: 'Season 27', format: 'league', status: 'completed' },
  podium: [row('Alex', 16, 5, 1, 0), row('Basil', 12, 4, 0, 2), row('Chris', 4, 1, 1, 4)],
  awards: [
    { label: 'Best defence', winners: ['Basil'], value: '0.83 conceded per match' },
    { label: 'Top scorer', winners: ['Alex', 'Chris'], value: '14 goals' },
    { label: 'Most Man of the Match', winners: ['Chris'], value: '3' },
    { label: 'Best average rating', winners: ['Alex'], value: '8.1' },
  ],
} as Parameters<typeof buildCeremony>[0];

describe('trophy ceremony', () => {
  it('lists every trophy and its winners in presentation order', () => {
    expect(buildCeremony(recap)).toEqual([
      { kind: 'title', winners: ['Alex'], detail: '16 points · 5W 1D 0L' },
      { kind: 'runner-up', winners: ['Basil'], detail: '12 points · finished second' },
      { kind: 'golden-ball', winners: ['Alex'], detail: '8.1 average rating' },
      { kind: 'golden-boot', winners: ['Alex', 'Chris'], detail: '14 goals' },
      { kind: 'motm', winners: ['Chris'], detail: '3× Man of the Match' },
      { kind: 'best-defence', winners: ['Basil'], detail: '0.83 conceded per match' },
    ]);
  });

  it('crowns a perfect champion', () => {
    const perfect = { ...recap, podium: [row('Alex', 18, 6, 0, 0), row('Basil', 12, 4, 0, 2)] };
    expect(buildCeremony(perfect)[0]).toMatchObject({ kind: 'title', perfect: true });
  });

  it('skips the runner-up for knockouts and anything undecided', () => {
    const knockout = { ...recap, tournament: { ...recap.tournament, format: 'knockout' } } as typeof recap;
    expect(buildCeremony(knockout).map((award) => award.kind)).not.toContain('runner-up');
    expect(buildCeremony({ ...recap, decided: false })).toEqual([]);
  });
});
