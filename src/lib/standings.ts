import { Match, Player, StandingsRow, FormResult } from "./types";

/**
 * Compute full standings table from played matches.
 * Sort: Points ▸ Goal Difference ▸ Goals Scored ▸ Head-to-Head points.
 */
export function computeStandings(
    players: Player[],
    matches: Match[]
): StandingsRow[] {
    const played = matches.filter(
        (m) =>
            m.isPlayed &&
            m.homePlayerId !== "BYE" &&
            m.awayPlayerId !== "BYE"
    );

    // Initialise rows
    const map = new Map<string, StandingsRow>();
    for (const p of players) {
        map.set(p.id, {
            playerId: p.id,
            playerName: p.name,
            team: p.team,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
            form: [],
        });
    }

    // Accumulate
    for (const m of played) {
        const home = map.get(m.homePlayerId);
        const away = map.get(m.awayPlayerId);
        if (!home || !away) continue;

        const hs = m.homeScore ?? 0;
        const as = m.awayScore ?? 0;

        home.played++;
        away.played++;
        home.goalsFor += hs;
        home.goalsAgainst += as;
        away.goalsFor += as;
        away.goalsAgainst += hs;

        if (hs > as) {
            home.won++;
            home.points += 3;
            away.lost++;
            home.form.push("W");
            away.form.push("L");
        } else if (hs < as) {
            away.won++;
            away.points += 3;
            home.lost++;
            home.form.push("L");
            away.form.push("W");
        } else {
            home.drawn++;
            away.drawn++;
            home.points += 1;
            away.points += 1;
            home.form.push("D");
            away.form.push("D");
        }
    }

    // Finalise
    for (const row of map.values()) {
        row.goalDifference = row.goalsFor - row.goalsAgainst;
        row.form = row.form.slice(-5).reverse(); // last 5, most recent first
    }

    // Head-to-head helper
    const h2hPoints = (a: string, b: string): number => {
        let pts = 0;
        for (const m of played) {
            if (m.homePlayerId === a && m.awayPlayerId === b) {
                const hs = m.homeScore ?? 0;
                const as = m.awayScore ?? 0;
                if (hs > as) pts += 3;
                else if (hs === as) pts += 1;
            }
            if (m.homePlayerId === b && m.awayPlayerId === a) {
                const hs = m.homeScore ?? 0;
                const as = m.awayScore ?? 0;
                if (as > hs) pts += 3;
                else if (hs === as) pts += 1;
            }
        }
        return pts;
    };

    // Sort
    const rows = Array.from(map.values());
    rows.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference)
            return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        // Head-to-head
        const h2hA = h2hPoints(a.playerId, b.playerId);
        const h2hB = h2hPoints(b.playerId, a.playerId);
        return h2hB - h2hA;
    });

    return rows;
}

/**
 * Get next unplayed match (lowest round number).
 */
export function getNextMatch(matches: Match[]): Match | null {
    const unplayed = matches
        .filter(
            (m) =>
                !m.isPlayed &&
                m.homePlayerId !== "BYE" &&
                m.awayPlayerId !== "BYE"
        )
        .sort((a, b) => a.roundNumber - b.roundNumber);
    return unplayed[0] ?? null;
}

/**
 * Analytics helpers
 */
export interface ScorerEntry {
    playerId: string;
    playerName: string;
    team: string;
    goals: number;
}

export function getGoldenBoot(players: Player[], matches: Match[]): ScorerEntry[] {
    const goalMap = new Map<string, number>();
    for (const m of matches.filter((m) => m.isPlayed)) {
        for (const g of m.homeGoalscorers) {
            const pid = typeof g === "string" ? g : g.playerId;
            goalMap.set(pid, (goalMap.get(pid) ?? 0) + 1);
        }
        for (const g of m.awayGoalscorers) {
            const pid = typeof g === "string" ? g : g.playerId;
            goalMap.set(pid, (goalMap.get(pid) ?? 0) + 1);
        }
    }

    return players
        .map((p) => ({
            playerId: p.id,
            playerName: p.name,
            team: p.team,
            goals: goalMap.get(p.id) ?? 0,
        }))
        .sort((a, b) => b.goals - a.goals);
}

export interface CleanSheetEntry {
    playerId: string;
    playerName: string;
    team: string;
    cleanSheets: number;
}

export function getGoldenGlove(
    players: Player[],
    matches: Match[]
): CleanSheetEntry[] {
    const csMap = new Map<string, number>();
    for (const m of matches.filter((m) => m.isPlayed)) {
        if (m.homePlayerId !== "BYE" && m.awayPlayerId !== "BYE") {
            if ((m.awayScore ?? 0) === 0) {
                csMap.set(m.homePlayerId, (csMap.get(m.homePlayerId) ?? 0) + 1);
            }
            if ((m.homeScore ?? 0) === 0) {
                csMap.set(m.awayPlayerId, (csMap.get(m.awayPlayerId) ?? 0) + 1);
            }
        }
    }

    return players
        .map((p) => ({
            playerId: p.id,
            playerName: p.name,
            team: p.team,
            cleanSheets: csMap.get(p.id) ?? 0,
        }))
        .sort((a, b) => b.cleanSheets - a.cleanSheets);
}

export interface UnluckyEntry {
    playerId: string;
    playerName: string;
    team: string;
    actualGoals: number;
    totalXg: number;
    diff: number; // actualGoals - totalXg (negative = unlucky)
}

export function getUnluckyIndex(
    players: Player[],
    matches: Match[]
): UnluckyEntry[] {
    const goalMap = new Map<string, number>();
    const xgMap = new Map<string, number>();

    for (const m of matches.filter((m) => m.isPlayed)) {
        if (m.homePlayerId !== "BYE" && m.awayPlayerId !== "BYE") {
            goalMap.set(
                m.homePlayerId,
                (goalMap.get(m.homePlayerId) ?? 0) + (m.homeScore ?? 0)
            );
            goalMap.set(
                m.awayPlayerId,
                (goalMap.get(m.awayPlayerId) ?? 0) + (m.awayScore ?? 0)
            );
            if (m.homeStats) {
                xgMap.set(
                    m.homePlayerId,
                    (xgMap.get(m.homePlayerId) ?? 0) + m.homeStats.xg
                );
            }
            if (m.awayStats) {
                xgMap.set(
                    m.awayPlayerId,
                    (xgMap.get(m.awayPlayerId) ?? 0) + m.awayStats.xg
                );
            }
        }
    }

    return players
        .map((p) => {
            const ag = goalMap.get(p.id) ?? 0;
            const xg = xgMap.get(p.id) ?? 0;
            return {
                playerId: p.id,
                playerName: p.name,
                team: p.team,
                actualGoals: ag,
                totalXg: Math.round(xg * 100) / 100,
                diff: Math.round((ag - xg) * 100) / 100,
            };
        })
        .sort((a, b) => a.diff - b.diff); // most unlucky first
}

export interface MvpEntry {
    playerId: string;
    playerName: string;
    team: string;
    avgRating: number;
    matchesRated: number;
    motmCount: number;
}

export function getMvpLeaderboard(
    players: Player[],
    matches: Match[]
): MvpEntry[] {
    const ratings = new Map<string, number[]>();
    const motmCounts = new Map<string, number>();

    for (const m of matches.filter((m) => m.isPlayed)) {
        if (m.homeStats) {
            const arr = ratings.get(m.homePlayerId) ?? [];
            arr.push(m.homeStats.rating);
            ratings.set(m.homePlayerId, arr);
            if (m.homeStats.motmPlayerId === m.homePlayerId) {
                motmCounts.set(
                    m.homePlayerId,
                    (motmCounts.get(m.homePlayerId) ?? 0) + 1
                );
            }
        }
        if (m.awayStats) {
            const arr = ratings.get(m.awayPlayerId) ?? [];
            arr.push(m.awayStats.rating);
            ratings.set(m.awayPlayerId, arr);
            if (m.awayStats.motmPlayerId === m.awayPlayerId) {
                motmCounts.set(
                    m.awayPlayerId,
                    (motmCounts.get(m.awayPlayerId) ?? 0) + 1
                );
            }
        }
    }

    return players
        .map((p) => {
            const r = ratings.get(p.id) ?? [];
            const avg =
                r.length > 0
                    ? Math.round((r.reduce((a, b) => a + b, 0) / r.length) * 100) / 100
                    : 0;
            return {
                playerId: p.id,
                playerName: p.name,
                team: p.team,
                avgRating: avg,
                matchesRated: r.length,
                motmCount: motmCounts.get(p.id) ?? 0,
            };
        })
        .sort((a, b) => b.avgRating - a.avgRating);
}

// ─── Additional Analytics ─────────────────────────────

export interface WinRateEntry {
    playerId: string;
    playerName: string;
    team: string;
    played: number;
    winRate: number; // 0-100
    wins: number;
}

export function getWinRates(players: Player[], matches: Match[]): WinRateEntry[] {
    const stats = new Map<string, { played: number; wins: number }>();
    for (const p of players) stats.set(p.id, { played: 0, wins: 0 });

    for (const m of matches.filter((m) => m.isPlayed && m.homePlayerId !== "BYE" && m.awayPlayerId !== "BYE")) {
        const hs = m.homeScore ?? 0;
        const as = m.awayScore ?? 0;
        const h = stats.get(m.homePlayerId);
        const a = stats.get(m.awayPlayerId);
        if (h) { h.played++; if (hs > as) h.wins++; }
        if (a) { a.played++; if (as > hs) a.wins++; }
    }

    return players
        .map((p) => {
            const s = stats.get(p.id) ?? { played: 0, wins: 0 };
            return {
                playerId: p.id,
                playerName: p.name,
                team: p.team,
                played: s.played,
                wins: s.wins,
                winRate: s.played > 0 ? Math.round((s.wins / s.played) * 100) : 0,
            };
        })
        .sort((a, b) => b.winRate - a.winRate);
}

export interface AvgGoalsEntry {
    playerId: string;
    playerName: string;
    team: string;
    totalGoals: number;
    played: number;
    avgGoals: number;
}

export function getAvgGoals(players: Player[], matches: Match[]): AvgGoalsEntry[] {
    const stats = new Map<string, { goals: number; played: number }>();
    for (const p of players) stats.set(p.id, { goals: 0, played: 0 });

    for (const m of matches.filter((m) => m.isPlayed && m.homePlayerId !== "BYE" && m.awayPlayerId !== "BYE")) {
        const h = stats.get(m.homePlayerId);
        const a = stats.get(m.awayPlayerId);
        if (h) { h.played++; h.goals += m.homeScore ?? 0; }
        if (a) { a.played++; a.goals += m.awayScore ?? 0; }
    }

    return players
        .map((p) => {
            const s = stats.get(p.id) ?? { goals: 0, played: 0 };
            return {
                playerId: p.id,
                playerName: p.name,
                team: p.team,
                totalGoals: s.goals,
                played: s.played,
                avgGoals: s.played > 0 ? Math.round((s.goals / s.played) * 100) / 100 : 0,
            };
        })
        .sort((a, b) => b.avgGoals - a.avgGoals);
}

export interface BiggestWinEntry {
    homePlayerName: string;
    awayPlayerName: string;
    homeScore: number;
    awayScore: number;
    margin: number;
    roundNumber: number;
}

export function getBiggestWins(players: Player[], matches: Match[]): BiggestWinEntry[] {
    const pMap = new Map(players.map((p) => [p.id, p.name]));
    return matches
        .filter((m) => m.isPlayed && m.homePlayerId !== "BYE" && m.awayPlayerId !== "BYE")
        .map((m) => ({
            homePlayerName: pMap.get(m.homePlayerId) ?? "?",
            awayPlayerName: pMap.get(m.awayPlayerId) ?? "?",
            homeScore: m.homeScore ?? 0,
            awayScore: m.awayScore ?? 0,
            margin: Math.abs((m.homeScore ?? 0) - (m.awayScore ?? 0)),
            roundNumber: m.roundNumber,
        }))
        .sort((a, b) => b.margin - a.margin)
        .slice(0, 5);
}

export interface H2HCell {
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
}

export function getH2HMatrix(
    players: Player[],
    matches: Match[]
): Map<string, Map<string, H2HCell>> {
    const matrix = new Map<string, Map<string, H2HCell>>();
    for (const p of players) {
        const row = new Map<string, H2HCell>();
        for (const q of players) {
            if (p.id !== q.id) row.set(q.id, { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 });
        }
        matrix.set(p.id, row);
    }

    for (const m of matches.filter((m) => m.isPlayed && m.homePlayerId !== "BYE" && m.awayPlayerId !== "BYE")) {
        const hs = m.homeScore ?? 0;
        const as = m.awayScore ?? 0;
        const hRow = matrix.get(m.homePlayerId)?.get(m.awayPlayerId);
        const aRow = matrix.get(m.awayPlayerId)?.get(m.homePlayerId);
        if (hRow) {
            hRow.goalsFor += hs;
            hRow.goalsAgainst += as;
            if (hs > as) hRow.wins++;
            else if (hs === as) hRow.draws++;
            else hRow.losses++;
        }
        if (aRow) {
            aRow.goalsFor += as;
            aRow.goalsAgainst += hs;
            if (as > hs) aRow.wins++;
            else if (hs === as) aRow.draws++;
            else aRow.losses++;
        }
    }

    return matrix;
}

export interface PossessionEntry {
    playerId: string;
    playerName: string;
    team: string;
    avgPossession: number;
    matchesTracked: number;
}

export function getPossessionKings(players: Player[], matches: Match[]): PossessionEntry[] {
    const data = new Map<string, number[]>();
    for (const p of players) data.set(p.id, []);

    for (const m of matches.filter((m) => m.isPlayed && m.homePlayerId !== "BYE" && m.awayPlayerId !== "BYE")) {
        if (m.homeStats) data.get(m.homePlayerId)?.push(m.homeStats.possession);
        if (m.awayStats) data.get(m.awayPlayerId)?.push(m.awayStats.possession);
    }

    return players
        .map((p) => {
            const vals = data.get(p.id) ?? [];
            return {
                playerId: p.id,
                playerName: p.name,
                team: p.team,
                avgPossession: vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0,
                matchesTracked: vals.length,
            };
        })
        .sort((a, b) => b.avgPossession - a.avgPossession);
}

// ─── Cumulative Goals Per Round (for line chart) ────

export function getCumulativeGoalsPerRound(
    players: Player[],
    matches: Match[]
): { players: { playerName: string; goalsPerRound: number[] }[]; roundLabels: string[] } {
    const maxRound = Math.max(...matches.map((m) => m.roundNumber), 0);
    const roundLabels = Array.from({ length: maxRound }, (_, i) => `R${i + 1}`);

    const result = players.map((p) => {
        let cumulative = 0;
        const goalsPerRound: number[] = [];

        for (let r = 1; r <= maxRound; r++) {
            const roundMatches = matches.filter(
                (m) =>
                    m.roundNumber === r &&
                    m.isPlayed &&
                    m.homePlayerId !== "BYE" &&
                    m.awayPlayerId !== "BYE" &&
                    (m.homePlayerId === p.id || m.awayPlayerId === p.id)
            );

            for (const m of roundMatches) {
                if (m.homePlayerId === p.id) cumulative += m.homeScore ?? 0;
                if (m.awayPlayerId === p.id) cumulative += m.awayScore ?? 0;
            }

            goalsPerRound.push(cumulative);
        }

        return { playerName: p.name, goalsPerRound };
    });

    return { players: result, roundLabels };
}

// ─── Per-Player Match History (cross-tournament) ────

export interface PlayerMatchRecord {
    tournamentName: string;
    tournamentId: string;
    roundNumber: number;
    opponentName: string;
    opponentTeam: string;
    goalsFor: number;
    goalsAgainst: number;
    result: "W" | "D" | "L";
    rating: number | null;
    possession: number | null;
    xg: number | null;
    isMotm: boolean;
}

export function getPlayerMatchHistory(
    playerName: string,
    tournaments: { id: string; name: string; players: Player[]; matches: Match[] }[]
): PlayerMatchRecord[] {
    const records: PlayerMatchRecord[] = [];

    for (const t of tournaments) {
        const tp = t.players.find(
            (p) => p.name.toLowerCase() === playerName.toLowerCase()
        );
        if (!tp) continue;

        const played = t.matches.filter(
            (m) =>
                m.isPlayed &&
                m.homePlayerId !== "BYE" &&
                m.awayPlayerId !== "BYE" &&
                (m.homePlayerId === tp.id || m.awayPlayerId === tp.id)
        );

        for (const m of played) {
            const isHome = m.homePlayerId === tp.id;
            const gf = isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
            const ga = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
            const oppId = isHome ? m.awayPlayerId : m.homePlayerId;
            const opp = t.players.find((p) => p.id === oppId);
            const myStats = isHome ? m.homeStats : m.awayStats;

            records.push({
                tournamentName: t.name,
                tournamentId: t.id,
                roundNumber: m.roundNumber,
                opponentName: opp?.name ?? "Unknown",
                opponentTeam: opp?.team ?? "",
                goalsFor: gf,
                goalsAgainst: ga,
                result: gf > ga ? "W" : gf === ga ? "D" : "L",
                rating: myStats?.rating ?? null,
                possession: myStats?.possession ?? null,
                xg: myStats?.xg ?? null,
                isMotm: myStats?.motmPlayerId === tp.id,
            });
        }
    }

    return records;
}

// ─── Per-Tournament Breakdown for a Player ──────────

export interface TournamentBreakdown {
    tournamentId: string;
    tournamentName: string;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goals: number;
    conceded: number;
    avgRating: number | null;
    motmCount: number;
    position: number;
    totalPlayers: number;
}

export function getPlayerTournamentBreakdowns(
    playerName: string,
    tournaments: { id: string; name: string; players: Player[]; matches: Match[] }[]
): TournamentBreakdown[] {
    const breakdowns: TournamentBreakdown[] = [];

    for (const t of tournaments) {
        const tp = t.players.find(
            (p) => p.name.toLowerCase() === playerName.toLowerCase()
        );
        if (!tp) continue;

        const played = t.matches.filter(
            (m) =>
                m.isPlayed &&
                m.homePlayerId !== "BYE" &&
                m.awayPlayerId !== "BYE" &&
                (m.homePlayerId === tp.id || m.awayPlayerId === tp.id)
        );

        if (played.length === 0) continue;

        let wins = 0, draws = 0, losses = 0, goals = 0, conceded = 0;
        let ratingSum = 0, ratedCount = 0, motmCount = 0;

        for (const m of played) {
            const isHome = m.homePlayerId === tp.id;
            const gf = isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
            const ga = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
            goals += gf;
            conceded += ga;
            if (gf > ga) wins++;
            else if (gf === ga) draws++;
            else losses++;

            const myStats = isHome ? m.homeStats : m.awayStats;
            if (myStats) {
                ratingSum += myStats.rating;
                ratedCount++;
                if (myStats.motmPlayerId === tp.id) motmCount++;
            }
        }

        // Get position in that tournament
        const standings = computeStandings(t.players, t.matches);
        const posIdx = standings.findIndex((r) => r.playerId === tp.id);

        breakdowns.push({
            tournamentId: t.id,
            tournamentName: t.name,
            played: played.length,
            wins, draws, losses, goals, conceded,
            avgRating: ratedCount > 0 ? ratingSum / ratedCount : null,
            motmCount,
            position: posIdx >= 0 ? posIdx + 1 : 0,
            totalPlayers: t.players.length,
        });
    }

    return breakdowns;
}

