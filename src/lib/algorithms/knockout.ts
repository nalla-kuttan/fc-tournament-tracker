import type { ScheduledMatch } from '@/lib/types';

/**
 * Generate seeded bracket positions using the standard tournament seeding algorithm.
 * Ensures seed 1 plays lowest seed, top seeds in opposite halves.
 * Returns an array of 1-based seed positions.
 */
function generateSeededPositions(bracketSize: number): number[] {
  if (bracketSize === 1) return [1];

  const half = generateSeededPositions(bracketSize / 2);
  const result: number[] = [];
  for (const seed of half) {
    result.push(seed);
    result.push(bracketSize + 1 - seed);
  }
  return result;
}

function nextPowerOf2(n: number): number {
  let power = 1;
  while (power < n) power *= 2;
  return power;
}

function getStageLabel(round: number, totalRounds: number): string {
  const roundsFromEnd = totalRounds - round;
  switch (roundsFromEnd) {
    case 0:
      return 'F';
    case 1:
      return 'SF';
    case 2:
      return 'QF';
    case 3:
      return 'R16';
    default:
      return `R${Math.pow(2, roundsFromEnd + 1)}`;
  }
}

/**
 * Generate a knockout bracket tournament.
 * Pads to next power-of-2 with BYEs for top seeds.
 * Returns all matches including future rounds (with null players).
 */
export function generateKnockoutBracket(playerIds: string[]): ScheduledMatch[] {
  const n = playerIds.length;

  if (n < 2) {
    throw new Error('Need at least 2 players for knockout');
  }

  const bracketSize = nextPowerOf2(n);
  const numByes = bracketSize - n;
  const totalRounds = Math.log2(bracketSize);

  // Generate seeded positions (1-based seed indices)
  const seedOrder = generateSeededPositions(bracketSize);

  // Map seed positions to player IDs
  // Players are assumed to be in seed order (index 0 = seed 1)
  // BYEs go to highest seed numbers
  const slots: (string | null)[] = seedOrder.map((seed) => {
    const playerIndex = seed - 1;
    return playerIndex < n ? playerIds[playerIndex] : null;
  });

  const schedule: ScheduledMatch[] = [];
  let matchCounter = 1;

  // Round 1: create matches from seeded slots
  const round1Matches = bracketSize / 2;
  for (let i = 0; i < round1Matches; i++) {
    const home = slots[i * 2];
    const away = slots[i * 2 + 1];
    const isBye = home === null || away === null;

    schedule.push({
      home_player_id: home ?? (away ?? ''),
      away_player_id: isBye ? null : away,
      round_number: 1,
      is_bye: isBye,
      match_number: matchCounter++,
      stage: getStageLabel(1, totalRounds),
    });
  }

  // Subsequent rounds: empty slots to be filled as winners progress
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);
    for (let i = 0; i < matchesInRound; i++) {
      schedule.push({
        home_player_id: '',
        away_player_id: null,
        round_number: round,
        is_bye: false,
        match_number: matchCounter++,
        stage: getStageLabel(round, totalRounds),
      });
    }
  }

  return schedule;
}

/**
 * Calculate which match number the winner of a given match feeds into.
 * Returns null if it's the final match.
 */
export function getNextMatchNumber(
  currentMatchNumber: number,
  round1MatchCount: number,
  totalMatches: number
): number | null {
  if (currentMatchNumber === totalMatches) return null;

  // Find the cumulative match count before the current round
  let cumulative = 0;
  let matchesInRound = round1MatchCount;
  let roundStart = 1;

  while (cumulative + matchesInRound < currentMatchNumber) {
    cumulative += matchesInRound;
    roundStart = cumulative + 1;
    matchesInRound = matchesInRound / 2;
  }

  // Position within the current round (0-based)
  const posInRound = currentMatchNumber - roundStart;
  // The match in the next round this feeds into
  const nextRoundStart = roundStart + matchesInRound;
  const nextMatchPos = Math.floor(posInRound / 2);

  return nextRoundStart + nextMatchPos;
}

/**
 * Determine if the winner goes to the home or away slot in the next match.
 * Odd-positioned matches (1st, 3rd, ...) in a round feed into home slot.
 * Even-positioned matches (2nd, 4th, ...) feed into away slot.
 */
export function isHomeSlotInNextMatch(
  currentMatchNumber: number,
  round1MatchCount: number
): boolean {
  let cumulative = 0;
  let matchesInRound = round1MatchCount;

  while (cumulative + matchesInRound < currentMatchNumber) {
    cumulative += matchesInRound;
    matchesInRound = matchesInRound / 2;
  }

  const posInRound = currentMatchNumber - cumulative - 1;
  return posInRound % 2 === 0;
}
