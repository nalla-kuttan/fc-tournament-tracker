import { Match, Player } from "./types";

function generateId(): string {
    return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export function generateKnockoutSchedule(
    players: Player[],
    tournamentId: string
): Match[] {
    const n = players.length;
    if (n < 2) return [];

    const roundCount = Math.ceil(Math.log2(n));
    const targetSize = Math.pow(2, roundCount);

    // Fill with dummy players for the bracket if needed
    const list: (string | null)[] = players.map(p => p.id);
    while (list.length < targetSize) {
        list.push(null); // BYE
    }

    const matches: Match[] = [];

    // Create matches by working backwards from the Final
    // For 4 players (targetSize=4, rounds=2):
    // Round 2 (Final): 1 match
    // Round 1 (Semis): 2 matches

    let currentRoundMatches: Match[] = [];
    let nextRoundMatches: Match[] = [];

    // Create the Final first
    const finalMatch: Match = createBaseMatch(tournamentId, roundCount, "Final");
    matches.push(finalMatch);
    nextRoundMatches = [finalMatch];

    // Work backwards through rounds
    for (let r = roundCount - 1; r >= 1; r--) {
        currentRoundMatches = [];
        const stageName = getStageName(r, roundCount);

        for (const parentMatch of nextRoundMatches) {
            const match1 = createBaseMatch(tournamentId, r, stageName);
            match1.nextMatchId = parentMatch.id;
            match1.isHomeInNextMatch = true;

            const match2 = createBaseMatch(tournamentId, r, stageName);
            match2.nextMatchId = parentMatch.id;
            match2.isHomeInNextMatch = false;

            currentRoundMatches.push(match1, match2);
            matches.push(match1, match2);
        }
        nextRoundMatches = currentRoundMatches;
    }

    // Now assign initial players to Round 1 matches
    const round1Matches = matches.filter(m => m.roundNumber === 1);
    for (let i = 0; i < round1Matches.length; i++) {
        const m = round1Matches[i];
        m.homePlayerId = list[i * 2] || "BYE";
        m.awayPlayerId = list[i * 2 + 1] || "BYE";

        // Auto-progress if one is BYE
        if (m.homePlayerId === "BYE" || m.awayPlayerId === "BYE") {
            // m.isPlayed = true; // Maybe don't mark as played, but handle in progression logic
        }
    }

    return matches;
}

function createBaseMatch(tournamentId: string, roundNumber: number, stage: string): Match {
    return {
        id: generateId(),
        tournamentId,
        roundNumber,
        stage,
        homePlayerId: null, // To be filled
        awayPlayerId: null, // To be filled
        homeScore: null,
        awayScore: null,
        isPlayed: false,
        homeStats: null,
        awayStats: null,
        homeGoalscorers: [],
        awayGoalscorers: [],
    };
}

function getStageName(r: number, totalRounds: number): string {
    if (r === totalRounds) return "Final";
    if (r === totalRounds - 1) return "Semi-final";
    if (r === totalRounds - 2) return "Quarter-final";
    return `Round ${r}`;
}
