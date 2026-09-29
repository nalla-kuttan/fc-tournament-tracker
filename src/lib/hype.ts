import { buildPlayerResults, type PlayerResult } from './player-results';
import type { Match, Player, RegisteredPlayer } from './types';

export interface HypeLine {
  kind: 'h2h-streak' | 'h2h-drought' | 'streak' | 'slump' | 'last-meeting' | 'first-meeting' | 'goals' | 'favourite';
  text: string;
  // Higher shows first.
  weight: number;
}

type PlayerInput = Pick<RegisteredPlayer, 'id' | 'name'>;
type InstanceInput = Pick<Player, 'id' | 'registered_player_id'>;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function currentRun(results: PlayerResult[], keep: (result: PlayerResult) => boolean) {
  let run = 0;
  for (let i = results.length - 1; i >= 0 && keep(results[i]); i--) run++;
  return run;
}

// Pre-match talking points built only from real results: the rivalry, form
// and how the ratings see it.
export function buildHypeLines(
  players: PlayerInput[],
  instances: InstanceInput[],
  matches: Match[],
  homeId: string,
  awayId: string,
  odds?: { home: number; away: number } | null,
  limit = 3
): HypeLine[] {
  const nameOf = new Map(players.map((player) => [player.id, player.name]));
  const home = nameOf.get(homeId) ?? 'Home';
  const away = nameOf.get(awayId) ?? 'Away';
  const results = buildPlayerResults(instances, matches);
  const lines: HypeLine[] = [];

  const meetings = (results.get(homeId) ?? []).filter((result) => result.opponentId === awayId);
  if (meetings.length === 0) {
    lines.push({ kind: 'first-meeting', text: `First ever meeting between ${home} and ${away}.`, weight: 90 });
  } else {
    const last = meetings.at(-1)!;
    // A run of wins for one side over the other, most recent first.
    const homeRun = currentRun(meetings, (m) => m.result === 'W');
    const awayRun = currentRun(meetings, (m) => m.result === 'L');
    if (homeRun >= 3) lines.push({ kind: 'h2h-streak', text: `${home} has won the last ${homeRun} meetings with ${away}.`, weight: 100 + homeRun });
    if (awayRun >= 3) lines.push({ kind: 'h2h-streak', text: `${away} has won the last ${awayRun} meetings with ${home}.`, weight: 100 + awayRun });
    const homeDrought = currentRun(meetings, (m) => m.result !== 'W');
    const awayDrought = currentRun(meetings, (m) => m.result !== 'L');
    if (homeDrought >= 4 && awayRun < 3) lines.push({ kind: 'h2h-drought', text: `${home} hasn't beaten ${away} in ${homeDrought} meetings.`, weight: 95 + homeDrought });
    if (awayDrought >= 4 && homeRun < 3) lines.push({ kind: 'h2h-drought', text: `${away} hasn't beaten ${home} in ${awayDrought} meetings.`, weight: 95 + awayDrought });

    const lastScore = last.result === 'D'
      ? `${home} ${last.scored}–${last.conceded} ${away}, a draw`
      : last.result === 'W' ? `${home} won ${last.scored}–${last.conceded}` : `${away} won ${last.conceded}–${last.scored}`;
    lines.push({ kind: 'last-meeting', text: `Last time: ${lastScore}.`, weight: 60 });

    const homeWins = meetings.filter((m) => m.result === 'W').length;
    const awayWins = meetings.filter((m) => m.result === 'L').length;
    if (meetings.length >= 5 && Math.max(homeWins, awayWins) / meetings.length >= 0.65) {
      const [leader, wins] = homeWins > awayWins ? [home, homeWins] : [away, awayWins];
      lines.push({ kind: 'h2h-streak', text: `${leader} has won ${wins} of their ${meetings.length} meetings.`, weight: 85 });
    } else if (meetings.length >= 5) {
      lines.push({ kind: 'h2h-streak', text: `${meetings.length} meetings: ${home} ${homeWins}, ${away} ${awayWins}, ${plural(meetings.length - homeWins - awayWins, 'draw')}.`, weight: 58 });
    }

    const goals = meetings.reduce((sum, m) => sum + m.scored + m.conceded, 0) / meetings.length;
    if (meetings.length >= 3 && goals >= 5) lines.push({ kind: 'goals', text: `Their ${meetings.length} meetings average ${goals.toFixed(1)} goals.`, weight: 70 });
  }

  for (const [id, name] of [[homeId, home], [awayId, away]] as const) {
    const own = results.get(id) ?? [];
    const wins = currentRun(own, (r) => r.result === 'W');
    const winless = currentRun(own, (r) => r.result !== 'W');
    if (wins >= 3) lines.push({ kind: 'streak', text: `${name} has won ${wins} in a row.`, weight: 80 + wins });
    else if (winless >= 4) lines.push({ kind: 'slump', text: `${name} is winless in ${plural(winless, 'match', 'matches')}.`, weight: 75 + winless });
  }

  if (odds) {
    const favourite = odds.home >= odds.away ? home : away;
    const chance = Math.max(odds.home, odds.away);
    if (chance >= 0.6) lines.push({ kind: 'favourite', text: `The ratings make ${favourite} a ${Math.round(chance * 100)}% favourite.`, weight: 65 });
    else lines.push({ kind: 'favourite', text: `The ratings call it close: ${Math.round(odds.home * 100)}% to ${Math.round(odds.away * 100)}%.`, weight: 55 });
  }

  return lines.sort((a, b) => b.weight - a.weight).slice(0, limit);
}
