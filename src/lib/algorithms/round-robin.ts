import type { ScheduledMatch } from '@/lib/types';

/**
 * Generate a round-robin schedule using the circle rotation method.
 * Every player plays every other player exactly once.
 * If odd number of players, a BYE sentinel is added.
 */
export function generateRoundRobin(playerIds: string[]): ScheduledMatch[] {
  const players = [...playerIds];
  const hasBye = players.length % 2 !== 0;

  if (hasBye) {
    players.push('BYE');
  }

  const n = players.length;
  const rounds = n - 1;
  const matchesPerRound = n / 2;
  const schedule: ScheduledMatch[] = [];
  let matchCounter = 1;

  // Fix the first player, rotate the rest (circle method)
  const fixed = players[0];
  const rotating = players.slice(1);

  for (let round = 0; round < rounds; round++) {
    const current = [fixed, ...rotating];

    for (let i = 0; i < matchesPerRound; i++) {
      const home = current[i];
      const away = current[n - 1 - i];
      const isBye = home === 'BYE' || away === 'BYE';

      if (isBye) {
        const realPlayer = home === 'BYE' ? away : home;
        schedule.push({
          home_player_id: realPlayer,
          away_player_id: null,
          round_number: round + 1,
          is_bye: true,
          match_number: matchCounter++,
          stage: null,
        });
      } else {
        // Alternate home/away based on round parity for fairness
        const homeId = round % 2 === 0 ? home : away;
        const awayId = round % 2 === 0 ? away : home;
        schedule.push({
          home_player_id: homeId,
          away_player_id: awayId,
          round_number: round + 1,
          is_bye: false,
          match_number: matchCounter++,
          stage: null,
        });
      }
    }

    // Rotate: move last to position 1
    rotating.unshift(rotating.pop()!);
  }

  return schedule;
}
