import { buildPlayerResults, type PlayerResult } from './player-results';
import type { Match, Player, RegisteredPlayer } from './types';

export interface RecordAlert {
  playerId: string;
  playerName: string;
  kind: 'win-streak' | 'unbeaten' | 'milestone';
  text: string;
  // How close: 0 means it happens with the next result.
  away: number;
  weight: number;
}

type PlayerInput = Pick<RegisteredPlayer, 'id' | 'name'>;
type InstanceInput = Pick<Player, 'id' | 'registered_player_id'>;

function runs(results: PlayerResult[], keep: (result: PlayerResult) => boolean) {
  let best = 0;
  let current = 0;
  for (const result of results) {
    current = keep(result) ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return { best, current };
}

const ordinalNumber = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`;

function nextMilestone(value: number, step: number) {
  return (Math.floor(value / step) + 1) * step;
}

// Records and milestones that the next results could set, so match night
// knows what's on the line.
export function buildRecordAlerts(
  players: PlayerInput[],
  instances: InstanceInput[],
  matches: Match[],
  goalsByPlayer: Map<string, number>,
  minimumStreak = 3
): RecordAlert[] {
  const nameOf = new Map(players.map((player) => [player.id, player.name]));
  const results = buildPlayerResults(instances, matches);
  const alerts: RecordAlert[] = [];

  const streakKinds = [
    { kind: 'win-streak' as const, keep: (r: PlayerResult) => r.result === 'W', noun: 'winning streak', unit: 'win' },
    { kind: 'unbeaten' as const, keep: (r: PlayerResult) => r.result !== 'L', noun: 'unbeaten run', unit: 'match unbeaten' },
  ];

  for (const streak of streakKinds) {
    const byPlayer = [...results].map(([id, list]) => ({ id, ...runs(list, streak.keep) }));
    const record = Math.max(0, ...byPlayer.map((row) => row.best));
    if (record < minimumStreak) continue;
    const holders = byPlayer.filter((row) => row.best === record).map((row) => nameOf.get(row.id) ?? 'Unknown');
    for (const row of byPlayer) {
      const name = nameOf.get(row.id) ?? 'Unknown';
      if (row.current < minimumStreak) continue;
      if (row.current < record - 2) {
        // Not close yet, but a run worth knowing about.
        if (streak.kind === 'win-streak') {
          alerts.push({ playerId: row.id, playerName: name, kind: streak.kind, text: `${name} has won ${row.current} in a row. The record is ${record}${holders.length === 1 && holders[0] === name ? `, also ${name}'s` : ` (${holders.join(' & ')})`}.`, away: record - row.current - 1, weight: 50 + row.current });
        }
        continue;
      }
      const others = holders.filter((holder) => holder !== name);
      const heldBy = others.length ? ` (held by ${others.join(' & ')})` : '';
      let text: string;
      let away: number;
      if (row.current >= record) {
        text = holders.length > 1 || row.current === record
          ? `${name} is level with the record ${record}-match ${streak.noun}${heldBy}. One more ${streak.unit === 'win' ? 'win' : 'match unbeaten'} breaks it.`
          : `${name} is on a record ${row.current}-match ${streak.noun}.`;
        away = 0;
      } else {
        const gap = record - row.current;
        text = `${name} is ${gap === 1 ? 'one' : gap} ${streak.unit === 'win' ? (gap === 1 ? 'win' : 'wins') : (gap === 1 ? 'match' : 'matches')} from equalling the record ${record}-match ${streak.noun}${heldBy}.`;
        away = gap - 1;
      }
      alerts.push({ playerId: row.id, playerName: name, kind: streak.kind, text, away, weight: 100 - away * 10 + row.current + (streak.kind === 'win-streak' ? 5 : 0) });
    }
  }

  for (const [id, list] of results) {
    const name = nameOf.get(id) ?? 'Unknown';
    const wins = list.filter((r) => r.result === 'W').length;
    const goals = goalsByPlayer.get(id) ?? 0;
    const checks = [
      { value: goals, step: 50, within: 10, noun: (n: number) => `${n} career goals`, unit: 'goal' },
      { value: wins, step: 25, within: 3, noun: (n: number) => `${n} career wins`, unit: 'win' },
      { value: list.length, step: 25, within: 3, noun: (n: number) => `their ${ordinalNumber(n)} match`, unit: 'match' },
    ];
    for (const check of checks) {
      if (check.value === 0) continue;
      const target = nextMilestone(check.value, check.step);
      const gap = target - check.value;
      if (gap > check.within) continue;
      const text = check.unit === 'match'
        ? gap === 1 ? `${name}'s next match is ${check.noun(target)}.` : `${name} is ${gap} matches from ${check.noun(target)}.`
        : `${name} is ${gap} ${gap === 1 ? check.unit : `${check.unit}s`} from ${check.noun(target)}.`;
      alerts.push({ playerId: id, playerName: name, kind: 'milestone', text, away: gap - 1, weight: 60 - gap * 4 });
    }
  }

  return alerts.sort((a, b) => b.weight - a.weight || a.playerName.localeCompare(b.playerName));
}
