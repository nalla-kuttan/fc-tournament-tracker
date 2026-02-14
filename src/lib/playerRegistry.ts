import { Tournament, RegisteredPlayer, CareerStats, GoalEntry } from "./types";

const REGISTRY_KEY = "fc-player-registry";

function emptyCareer(): CareerStats {
    return {
        totalMatches: 0,
        totalWins: 0,
        totalDraws: 0,
        totalLosses: 0,
        totalGoals: 0,
        totalCleanSheets: 0,
        totalRatingSum: 0,
        totalRatedMatches: 0,
        totalMotm: 0,
        tournamentsPlayed: [],
    };
}

// ─── CRUD ────────────────────────────────────────────

export function loadRegistry(): RegisteredPlayer[] {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(REGISTRY_KEY);
    return raw ? JSON.parse(raw) : [];
}

export function saveRegistry(players: RegisteredPlayer[]): void {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(players));
}

export function getOrCreatePlayer(
    name: string,
    team: string,
    id?: string
): RegisteredPlayer {
    const registry = loadRegistry();
    // Match by name (case-insensitive)
    const existing = registry.find(
        (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
        // Update team to latest
        existing.team = team;
        saveRegistry(registry);
        return existing;
    }

    const newPlayer: RegisteredPlayer = {
        id: id || crypto.randomUUID().replace(/-/g, "").slice(0, 16),
        name,
        team,
        createdAt: new Date().toISOString(),
        career: emptyCareer(),
    };
    registry.push(newPlayer);
    saveRegistry(registry);
    return newPlayer;
}

export function findRegisteredPlayer(name: string): RegisteredPlayer | undefined {
    return loadRegistry().find(
        (p) => p.name.toLowerCase() === name.toLowerCase()
    );
}

// ─── Career Sync ─────────────────────────────────────

/**
 * Recalculates career stats for all players from ALL tournaments.
 * Called after saving a match result.
 */
export function syncCareerStats(tournaments: Tournament[]): void {
    const registry = loadRegistry();

    // Reset all careers
    for (const p of registry) {
        p.career = emptyCareer();
    }

    for (const t of tournaments) {
        const played = t.matches.filter(
            (m) =>
                m.isPlayed &&
                m.homePlayerId !== "BYE" &&
                m.awayPlayerId !== "BYE"
        );

        // Track which players are in this tournament
        const tournamentPlayerIds = new Set(t.players.map((p) => p.id));

        for (const m of played) {
            const hs = m.homeScore ?? 0;
            const as = m.awayScore ?? 0;

            // Count goals from goalscorers array
            const homeGoalCount = m.homeGoalscorers.length;
            const awayGoalCount = m.awayGoalscorers.length;

            for (const regPlayer of registry) {
                // Match by player name to the tournament player
                const tournamentPlayer = t.players.find(
                    (tp) => tp.name.toLowerCase() === regPlayer.name.toLowerCase()
                );
                if (!tournamentPlayer) continue;

                const pid = tournamentPlayer.id;

                if (pid === m.homePlayerId) {
                    regPlayer.career.totalMatches++;
                    regPlayer.career.totalGoals += Math.max(hs, homeGoalCount);
                    if (hs > as) regPlayer.career.totalWins++;
                    else if (hs === as) regPlayer.career.totalDraws++;
                    else regPlayer.career.totalLosses++;
                    if (as === 0) regPlayer.career.totalCleanSheets++;
                    if (m.homeStats) {
                        regPlayer.career.totalRatingSum += m.homeStats.rating;
                        regPlayer.career.totalRatedMatches++;
                        if (m.homeStats.motmPlayerId === pid) {
                            regPlayer.career.totalMotm++;
                        }
                    }
                } else if (pid === m.awayPlayerId) {
                    regPlayer.career.totalMatches++;
                    regPlayer.career.totalGoals += Math.max(as, awayGoalCount);
                    if (as > hs) regPlayer.career.totalWins++;
                    else if (hs === as) regPlayer.career.totalDraws++;
                    else regPlayer.career.totalLosses++;
                    if (hs === 0) regPlayer.career.totalCleanSheets++;
                    if (m.awayStats) {
                        regPlayer.career.totalRatingSum += m.awayStats.rating;
                        regPlayer.career.totalRatedMatches++;
                        if (m.awayStats.motmPlayerId === pid) {
                            regPlayer.career.totalMotm++;
                        }
                    }
                }
            }
        }

        // Mark tournament participation
        for (const regPlayer of registry) {
            const tp = t.players.find(
                (p) => p.name.toLowerCase() === regPlayer.name.toLowerCase()
            );
            if (tp && !regPlayer.career.tournamentsPlayed.includes(t.id)) {
                regPlayer.career.tournamentsPlayed.push(t.id);
            }
        }
    }

    saveRegistry(registry);
}

/**
 * Get a sorted career leaderboard (by total goals, then win rate).
 */
export function getCareerLeaderboard(): RegisteredPlayer[] {
    return loadRegistry()
        .filter((p) => p.career.totalMatches > 0)
        .sort((a, b) => {
            const aWR = a.career.totalMatches > 0 ? a.career.totalWins / a.career.totalMatches : 0;
            const bWR = b.career.totalMatches > 0 ? b.career.totalWins / b.career.totalMatches : 0;
            if (b.career.totalGoals !== a.career.totalGoals)
                return b.career.totalGoals - a.career.totalGoals;
            return bWR - aWR;
        });
}
