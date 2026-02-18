"use server";

import prisma from "@/lib/db";
import { Tournament, Player, Match, MatchStats } from "@/lib/types";

// Helper to convert Prisma Tournament to Frontend Tournament
function mapTournament(t: any): Tournament {
    try {
        return {
            id: t.id,
            name: t.name,
            format: t.format as any,
            status: t.status as any,
            createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : new Date().toISOString(),
            adminPin: t.adminPin || "1234",
            players: (t.players || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                team: p.team
            })),
            matches: (t.matches || []).map((m: any) => ({
                id: m.id,
                tournamentId: m.tournamentId,
                roundNumber: m.roundNumber,
                stage: m.stage || undefined,
                homePlayerId: m.homePlayerId || "BYE",
                awayPlayerId: m.awayPlayerId || "BYE",
                homeScore: m.homeScore,
                awayScore: m.awayScore,
                isPlayed: m.isPlayed,
                nextMatchId: m.nextMatchId || undefined,
                isHomeInNextMatch: m.isHomeInNextMatch,
                homeStats: m.isPlayed ? {
                    xg: m.homeXg || 0,
                    possession: m.homePossession || 50,
                    tackles: m.homeTackles || 0,
                    interceptions: m.homeInterceptions || 0,
                    motmPlayerId: m.homeIsMotm ? m.homePlayerId : null,
                    rating: m.homeRating || 6.0
                } : null,
                awayStats: m.isPlayed ? {
                    xg: m.awayXg || 0,
                    possession: m.awayPossession || 50,
                    tackles: m.awayTackles || 0,
                    interceptions: m.awayInterceptions || 0,
                    motmPlayerId: m.awayIsMotm ? m.awayPlayerId : null,
                    rating: m.awayRating || 6.0
                } : null,
                homeGoalscorers: (m.goals || []).filter((g: any) => g.side === "home").map((g: any) => ({ playerId: g.playerId, minute: g.minute })),
                awayGoalscorers: (m.goals || []).filter((g: any) => g.side === "away").map((g: any) => ({ playerId: g.playerId, minute: g.minute })),
            }))
        };
    } catch (e) {
        console.error("Error mapping tournament", t.id, e);
        // Return a dummy tournament to avoid crashing the whole list
        return {
            id: t.id || "error",
            name: "Error loading: " + (t.name || t.id),
            format: "single",
            status: "active", // Default to active if error
            createdAt: new Date().toISOString(),
            adminPin: "1234",
            players: [],
            matches: []
        };
    }
}

export async function listTournaments(): Promise<Tournament[]> {
    try {
        const ts = await prisma.tournament.findMany({
            include: {
                players: true,
                matches: {
                    include: { goals: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });
        return ts.map(mapTournament);
    } catch (e) {
        console.error("Error listing tournaments", e);
        return [];
    }
}

export async function loadTournament(id: string): Promise<Tournament | null> {
    const t = await prisma.tournament.findUnique({
        where: { id },
        include: {
            players: true,
            matches: {
                include: { goals: true }
            }
        }
    });
    if (!t) return null;
    return mapTournament(t);
}

export async function deleteTournament(id: string) {
    await prisma.tournament.delete({ where: { id } });
}

export async function saveTournament(tournament: Tournament) {
    const { id, name, format, status, adminPin, players, matches } = tournament;

    // 1. Upsert Tournament
    await prisma.tournament.upsert({
        where: { id },
        update: { name, format, status, adminPin },
        create: { id, name, format, status, adminPin }
    });

    // 2. Upsert Players
    for (const p of players) {
        await prisma.player.upsert({
            where: { id: p.id },
            update: { name: p.name, team: p.team },
            create: { id: p.id, name: p.name, team: p.team, tournamentId: id }
        });
    }

    // 3. Upsert Matches and Goals
    for (const m of matches) {
        const homePlayerId = m.homePlayerId === "BYE" ? null : m.homePlayerId;
        const awayPlayerId = m.awayPlayerId === "BYE" ? null : m.awayPlayerId;

        await prisma.match.upsert({
            where: { id: m.id },
            update: {
                roundNumber: m.roundNumber,
                stage: m.stage ?? null,
                homePlayerId,
                awayPlayerId,
                homeScore: m.homeScore,
                awayScore: m.awayScore,
                isPlayed: m.isPlayed,
                nextMatchId: m.nextMatchId ?? null,
                isHomeInNextMatch: m.isHomeInNextMatch ?? true,
                homeXg: m.homeStats?.xg ?? null,
                homePossession: m.homeStats?.possession ?? null,
                homeTackles: m.homeStats?.tackles ?? null,
                homeInterceptions: m.homeStats?.interceptions ?? null,
                homeRating: m.homeStats?.rating ?? null,
                homeIsMotm: m.homeStats?.motmPlayerId === m.homePlayerId,
                awayXg: m.awayStats?.xg ?? null,
                awayPossession: m.awayStats?.possession ?? null,
                awayTackles: m.awayStats?.tackles ?? null,
                awayInterceptions: m.awayStats?.interceptions ?? null,
                awayRating: m.awayStats?.rating ?? null,
                awayIsMotm: m.awayStats?.motmPlayerId === m.awayPlayerId,
            },
            create: {
                id: m.id,
                tournamentId: id,
                roundNumber: m.roundNumber,
                stage: m.stage ?? null,
                homePlayerId,
                awayPlayerId,
                homeScore: m.homeScore,
                awayScore: m.awayScore,
                isPlayed: m.isPlayed,
                nextMatchId: m.nextMatchId ?? null,
                isHomeInNextMatch: m.isHomeInNextMatch ?? true,
                homeXg: m.homeStats?.xg ?? null,
                homePossession: m.homeStats?.possession ?? null,
                homeTackles: m.homeStats?.tackles ?? null,
                homeInterceptions: m.homeStats?.interceptions ?? null,
                homeRating: m.homeStats?.rating ?? null,
                homeIsMotm: m.homeStats?.motmPlayerId === m.homePlayerId,
                awayXg: m.awayStats?.xg ?? null,
                awayPossession: m.awayStats?.possession ?? null,
                awayTackles: m.awayStats?.tackles ?? null,
                awayInterceptions: m.awayStats?.interceptions ?? null,
                awayRating: m.awayStats?.rating ?? null,
                awayIsMotm: m.awayStats?.motmPlayerId === m.awayPlayerId,
            }
        });

        // Handle goals separately
        await prisma.goal.deleteMany({ where: { matchId: m.id } });

        const allGoals = [
            ...(m.homeGoalscorers || []).map(g => ({ ...g, side: "home" })),
            ...(m.awayGoalscorers || []).map(g => ({ ...g, side: "away" }))
        ];

        if (allGoals.length > 0) {
            await prisma.goal.createMany({
                data: allGoals.map((g: any) => ({
                    matchId: m.id,
                    playerId: g.playerId,
                    minute: g.minute,
                    side: g.side
                }))
            });
        }
    }

    // 4. Second pass for winner progression (Knockout only)
    for (const m of matches) {
        if (m.isPlayed && m.nextMatchId) {
            const winnerId = (m.homeScore || 0) > (m.awayScore || 0) ? m.homePlayerId : m.awayPlayerId;
            if (winnerId && winnerId !== "BYE") {
                const dataToUpdate = m.isHomeInNextMatch ? { homePlayerId: winnerId } : { awayPlayerId: winnerId };
                await prisma.match.update({
                    where: { id: m.nextMatchId },
                    data: dataToUpdate
                });
            }
        }
    }
}

export async function completeTournament(id: string) {
    const t = await prisma.tournament.findUnique({
        where: { id },
        include: { matches: { include: { goals: true } }, players: true }
    });

    if (!t) throw new Error("Tournament not found");

    // Determine Winner
    let winner: Player | undefined;

    if (t.format === "knockout") {
        // Find the final match
        const maxRound = Math.max(...t.matches.map(m => m.roundNumber));
        const finalMatches = t.matches.filter(m => m.roundNumber === maxRound);

        const finalMatch = finalMatches[0];
        if (finalMatch && finalMatch.isPlayed) {
            const homeScore = finalMatch.homeScore ?? 0;
            const awayScore = finalMatch.awayScore ?? 0;
            const winnerId = homeScore > awayScore ? finalMatch.homePlayerId : finalMatch.awayPlayerId;
            if (winnerId) winner = t.players.find(p => p.id === winnerId);
        }
    } else {
        // League or Group
        const scores = new Map<string, { points: number, gd: number, gf: number }>();
        t.players.forEach(p => scores.set(p.id, { points: 0, gd: 0, gf: 0 }));

        for (const m of t.matches) {
            if (!m.isPlayed || !m.homePlayerId || !m.awayPlayerId || m.homePlayerId === "BYE" || m.awayPlayerId === "BYE") continue;

            const hs = m.homeScore ?? 0;
            const as = m.awayScore ?? 0;

            const home = scores.get(m.homePlayerId)!;
            const away = scores.get(m.awayPlayerId)!;

            home.gf += hs;
            home.gd += (hs - as);
            away.gf += as;
            away.gd += (as - hs);

            if (hs > as) home.points += 3;
            else if (as > hs) away.points += 3;
            else {
                home.points += 1;
                away.points += 1;
            }
        }

        const sorted = [...scores.entries()].sort((a, b) => {
            if (b[1].points !== a[1].points) return b[1].points - a[1].points;
            if (b[1].gd !== a[1].gd) return b[1].gd - a[1].gd;
            return b[1].gf - a[1].gf;
        });

        if (sorted.length > 0) {
            winner = t.players.find(p => p.id === sorted[0][0]);
        }
    }

    if (winner) {
        await prisma.hallOfFame.create({
            data: {
                tournamentName: t.name,
                winnerName: winner.name,
                winnerTeam: winner.team
            }
        });
    }

    await prisma.tournament.update({
        where: { id },
        data: { status: "completed" }
    });
}


export async function getHallOfFame() {
    return await prisma.hallOfFame.findMany({
        orderBy: { date: 'desc' }
    });
}

import { revalidatePath } from "next/cache";

export async function updateTournamentName(id: string, name: string) {
    const t = await prisma.tournament.findUnique({ where: { id } });
    if (!t) return;

    // Transaction to ensure both update or neither
    await prisma.$transaction([
        prisma.tournament.update({
            where: { id },
            data: { name }
        }),
        prisma.hallOfFame.updateMany({
            where: { tournamentName: t.name },
            data: { tournamentName: name }
        })
    ]);

    revalidatePath("/");
    revalidatePath(`/tournament/${id}`);
}
