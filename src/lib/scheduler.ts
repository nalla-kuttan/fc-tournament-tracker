import { Match, Player, TournamentFormat } from "./types";

/**
 * Round-robin schedule generator using the "circle method".
 *
 * - If the player count is odd, a virtual "BYE" player is added.
 * - Fix player[0] in place, rotate the rest clockwise each round.
 * - For double-leg format, mirror rounds are appended with home/away swapped.
 */

function generateId(): string {
    return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export function generateSchedule(
    players: Player[],
    tournamentId: string,
    format: TournamentFormat
): Match[] {
    const ids = players.map((p) => p.id);
    const list = [...ids];

    // If odd, add a BYE placeholder
    if (list.length % 2 !== 0) {
        list.push("BYE");
    }

    const n = list.length;
    const totalRounds = n - 1;
    const matchesPerRound = n / 2;

    const rounds: { home: string; away: string }[][] = [];

    for (let round = 0; round < totalRounds; round++) {
        const roundMatches: { home: string; away: string }[] = [];

        for (let i = 0; i < matchesPerRound; i++) {
            const home = list[i];
            const away = list[n - 1 - i];
            roundMatches.push({ home, away });
        }

        rounds.push(roundMatches);

        // Rotate: keep list[0] fixed, shift the rest
        const last = list.pop()!;
        list.splice(1, 0, last);
    }

    // Build Match objects
    const matches: Match[] = [];

    const buildMatch = (
        home: string,
        away: string,
        roundNumber: number
    ): Match => ({
        id: generateId(),
        tournamentId,
        roundNumber,
        homePlayerId: home,
        awayPlayerId: away,
        homeScore: null,
        awayScore: null,
        isPlayed: false,
        homeStats: null,
        awayStats: null,
        homeGoalscorers: [],
        awayGoalscorers: [],
    });

    for (let r = 0; r < rounds.length; r++) {
        for (const m of rounds[r]) {
            matches.push(buildMatch(m.home, m.away, r + 1));
        }
    }

    // Double leg: mirror with swapped home/away
    if (format === "double") {
        const extraRounds = rounds.length;
        for (let r = 0; r < rounds.length; r++) {
            for (const m of rounds[r]) {
                matches.push(buildMatch(m.away, m.home, extraRounds + r + 1));
            }
        }
    }

    return matches;
}

/**
 * Reorder rounds: given a permutation array (new order of round numbers),
 * reassign roundNumber on each match.
 */
export function reorderRounds(
    matches: Match[],
    roundOrder: number[]
): Match[] {
    const mapping = new Map<number, number>();
    roundOrder.forEach((oldRound, newIndex) => {
        mapping.set(oldRound, newIndex + 1);
    });

    return matches.map((m) => ({
        ...m,
        roundNumber: mapping.get(m.roundNumber) ?? m.roundNumber,
    }));
}
