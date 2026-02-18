"use server";

import prisma from "@/lib/db";
import { RegisteredPlayer, CareerStats, Tournament } from "@/lib/types";

export async function getCareerLeaderboard(): Promise<RegisteredPlayer[]> {
    const players = await prisma.registeredPlayer.findMany({
        orderBy: { totalWins: "desc" } // default sort
    });

    return players.map(p => ({
        id: p.id,
        name: p.name,
        team: p.team,
        createdAt: p.createdAt.toISOString(),
        career: {
            totalMatches: p.totalMatches,
            totalWins: p.totalWins,
            totalDraws: p.totalDraws,
            totalLosses: p.totalLosses,
            totalGoals: p.totalGoals,
            totalConceded: p.totalConceded,
            totalCleanSheets: p.totalCleanSheets,
            totalXg: p.totalXg,
            totalRatingSum: p.totalRatingSum,
            totalRatedMatches: p.totalRatedMatches,
            totalPossessionSum: p.totalPossessionSum,
            totalPossessionMatches: p.totalPossessionMatches,
            totalMotm: p.totalMotm,
            tournamentsPlayed: JSON.parse(p.tournamentsPlayedJson)
        }
    }));
}

export async function saveRegisteredPlayer(player: RegisteredPlayer) {
    const { name, team, career } = player;
    await prisma.registeredPlayer.upsert({
        where: { name },
        update: {
            team,
            totalMatches: career.totalMatches,
            totalWins: career.totalWins,
            totalDraws: career.totalDraws,
            totalLosses: career.totalLosses,
            totalGoals: career.totalGoals,
            totalConceded: career.totalConceded,
            totalCleanSheets: career.totalCleanSheets,
            totalXg: career.totalXg,
            totalRatingSum: career.totalRatingSum,
            totalRatedMatches: career.totalRatedMatches,
            totalPossessionSum: career.totalPossessionSum,
            totalPossessionMatches: career.totalPossessionMatches,
            totalMotm: career.totalMotm,
            tournamentsPlayedJson: JSON.stringify(career.tournamentsPlayed)
        },
        create: {
            name,
            team,
            totalMatches: career.totalMatches,
            totalWins: career.totalWins,
            totalDraws: career.totalDraws,
            totalLosses: career.totalLosses,
            totalGoals: career.totalGoals,
            totalConceded: career.totalConceded,
            totalCleanSheets: career.totalCleanSheets,
            totalXg: career.totalXg,
            totalRatingSum: career.totalRatingSum,
            totalRatedMatches: career.totalRatedMatches,
            totalPossessionSum: career.totalPossessionSum,
            totalPossessionMatches: career.totalPossessionMatches,
            totalMotm: career.totalMotm,
            tournamentsPlayedJson: JSON.stringify(career.tournamentsPlayed)
        }
    });
}
export async function getH2HStats(p1Name: string, p2Name: string) {
    const matches = await prisma.match.findMany({
        where: {
            isPlayed: true,
            OR: [
                {
                    homePlayer: { name: p1Name },
                    awayPlayer: { name: p2Name }
                },
                {
                    homePlayer: { name: p2Name },
                    awayPlayer: { name: p1Name }
                }
            ]
        },
        include: {
            tournament: true,
            homePlayer: true,
            awayPlayer: true,
            goals: true
        },
        orderBy: { tournament: { createdAt: "desc" } }
    });

    const stats = {
        p1: p1Name,
        p2: p2Name,
        totalMatches: matches.length,
        p1Wins: 0,
        p2Wins: 0,
        draws: 0,
        p1Goals: 0,
        p2Goals: 0,
        history: [] as any[]
    };

    stats.history = matches.map(m => {
        const isP1Home = m.homePlayer?.name === p1Name;
        const p1Score = isP1Home ? (m.homeScore || 0) : (m.awayScore || 0);
        const p2Score = isP1Home ? (m.awayScore || 0) : (m.homeScore || 0);

        if (p1Score > p2Score) stats.p1Wins++;
        else if (p2Score > p1Score) stats.p2Wins++;
        else stats.draws++;

        stats.p1Goals += p1Score;
        stats.p2Goals += p2Score;

        return {
            id: m.id,
            tournamentName: m.tournament.name,
            p1Score,
            p2Score,
            date: m.tournament.createdAt.toISOString()
        };
    });

    return stats;
}

export async function getPlayerFormTrend(playerName: string) {
    const matches = await prisma.match.findMany({
        where: {
            isPlayed: true,
            OR: [
                { homePlayer: { name: playerName } },
                { awayPlayer: { name: playerName } }
            ]
        },
        include: {
            tournament: true,
            homePlayer: true,
            awayPlayer: true
        },
        orderBy: { tournament: { createdAt: "asc" } } // ascending for trend
    });

    return matches.map(m => {
        const isHome = m.homePlayer?.name === playerName;
        const scoreFor = isHome ? (m.homeScore || 0) : (m.awayScore || 0);
        const scoreAgainst = isHome ? (m.awayScore || 0) : (m.homeScore || 0);
        const rating = isHome ? (m.homeRating || 0) : (m.awayRating || 0);
        const xg = isHome ? (m.homeXg || 0) : (m.awayXg || 0);

        let result = "D";
        if (scoreFor > scoreAgainst) result = "W";
        if (scoreFor < scoreAgainst) result = "L";

        return {
            date: m.tournament.createdAt.toISOString(),
            tournamentName: m.tournament.name,
            scoreFor,
            scoreAgainst,
            rating,
            xg,
            result
        };
    });
}
