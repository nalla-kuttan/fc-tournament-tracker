import { Tournament, RegisteredPlayer, CareerStats, GoalEntry } from "./types";
import {
    getCareerLeaderboard as getCareerLeaderboardAction,
    saveRegisteredPlayer as saveRegisteredPlayerAction
} from "./actions/playerActions";
import { listTournaments } from "./actions/tournamentActions";

function emptyCareer(): CareerStats {
    return {
        totalMatches: 0,
        totalWins: 0,
        totalDraws: 0,
        totalLosses: 0,
        totalGoals: 0,
        totalConceded: 0,
        totalCleanSheets: 0,
        totalXg: 0,
        totalRatingSum: 0,
        totalRatedMatches: 0,
        totalPossessionSum: 0,
        totalPossessionMatches: 0,
        totalMotm: 0,
        tournamentsPlayed: [],
    };
}

// ─── CRUD ────────────────────────────────────────────

export async function loadRegistry(): Promise<RegisteredPlayer[]> {
    return await getCareerLeaderboardAction();
}

export async function saveRegistry(players: RegisteredPlayer[]): Promise<void> {
    for (const p of players) {
        await saveRegisteredPlayerAction(p);
    }
}

export async function getOrCreatePlayer(
    name: string,
    team: string,
    id?: string
): Promise<RegisteredPlayer> {
    const registry = await loadRegistry();
    const existing = registry.find(
        (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
        existing.team = team;
        await saveRegisteredPlayerAction(existing);
        return existing;
    }

    const newPlayer: RegisteredPlayer = {
        id: id || crypto.randomUUID().replace(/-/g, "").slice(0, 16),
        name,
        team,
        createdAt: new Date().toISOString(),
        career: emptyCareer(),
    };
    await saveRegisteredPlayerAction(newPlayer);
    return newPlayer;
}

export async function findRegisteredPlayer(name: string): Promise<RegisteredPlayer | undefined> {
    const registry = await loadRegistry();
    return registry.find(
        (p) => p.name.toLowerCase() === name.toLowerCase()
    );
}

// ─── Career Sync ─────────────────────────────────────

/**
 * Recalculates career stats for all players from ALL tournaments.
 */
export async function syncCareerStats(tournaments?: Tournament[]): Promise<void> {
    const ts = tournaments || await listTournaments();
    const registry = await loadRegistry();

    // Reset all careers locally before recalculating
    for (const p of registry) {
        p.career = emptyCareer();
    }

    for (const t of ts) {
        const played = t.matches.filter(
            (m) =>
                m.isPlayed &&
                m.homePlayerId !== "BYE" &&
                m.awayPlayerId !== "BYE"
        );

        for (const m of played) {
            const hs = m.homeScore ?? 0;
            const as = m.awayScore ?? 0;

            const finalHomeGoals = Math.max(hs, m.homeGoalscorers.length);
            const finalAwayGoals = Math.max(as, m.awayGoalscorers.length);

            for (const regPlayer of registry) {
                const tournamentPlayer = t.players.find(
                    (tp) => tp.name.toLowerCase() === regPlayer.name.toLowerCase()
                );
                if (!tournamentPlayer) continue;

                const pid = tournamentPlayer.id;

                if (pid === m.homePlayerId) {
                    regPlayer.career.totalMatches++;
                    regPlayer.career.totalGoals += finalHomeGoals;
                    regPlayer.career.totalConceded += finalAwayGoals;
                    if (hs > as) regPlayer.career.totalWins++;
                    else if (hs === as) regPlayer.career.totalDraws++;
                    else regPlayer.career.totalLosses++;
                    if (as === 0) regPlayer.career.totalCleanSheets++;

                    if (m.homeStats) {
                        regPlayer.career.totalRatingSum += m.homeStats.rating;
                        regPlayer.career.totalRatedMatches++;
                        regPlayer.career.totalXg += (m.homeStats.xg || 0);
                        regPlayer.career.totalPossessionSum += (m.homeStats.possession || 50);
                        regPlayer.career.totalPossessionMatches++;
                        if (m.homeStats.motmPlayerId === pid) {
                            regPlayer.career.totalMotm++;
                        }
                    }
                } else if (pid === m.awayPlayerId) {
                    regPlayer.career.totalMatches++;
                    regPlayer.career.totalGoals += finalAwayGoals;
                    regPlayer.career.totalConceded += finalHomeGoals;
                    if (as > hs) regPlayer.career.totalWins++;
                    else if (hs === as) regPlayer.career.totalDraws++;
                    else regPlayer.career.totalLosses++;
                    if (hs === 0) regPlayer.career.totalCleanSheets++;

                    if (m.awayStats) {
                        regPlayer.career.totalRatingSum += m.awayStats.rating;
                        regPlayer.career.totalRatedMatches++;
                        regPlayer.career.totalXg += (m.awayStats.xg || 0);
                        regPlayer.career.totalPossessionSum += (m.awayStats.possession || 50);
                        regPlayer.career.totalPossessionMatches++;
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

    await saveRegistry(registry);
}

/**
 * Get a sorted career leaderboard.
 */
export async function getCareerLeaderboard(): Promise<RegisteredPlayer[]> {
    const registry = await loadRegistry();
    return registry
        .filter((p) => p.career.totalMatches > 0)
        .sort((a, b) => {
            const aWR = a.career.totalMatches > 0 ? a.career.totalWins / a.career.totalMatches : 0;
            const bWR = b.career.totalMatches > 0 ? b.career.totalWins / b.career.totalMatches : 0;
            if (b.career.totalGoals !== a.career.totalGoals)
                return b.career.totalGoals - a.career.totalGoals;
            return bWR - aWR;
        });
}
