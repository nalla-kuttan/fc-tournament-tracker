
import { PrismaClient } from '@prisma/client'

// Use absolute path for safety
process.env.DATABASE_URL = "file:/Users/ruban/.gemini/antigravity/playground/inner-celestial/prisma/prisma/dev.db"

const prisma = new PrismaClient()

// Player Data
const PLAYERS = [
    { name: "Ruban", team: "Chelsea" },
    { name: "Basil", team: "FC Barcelona" },
    { name: "Alex", team: "Tottenham" },
    { name: "Arshad", team: "Real Madrid" },
    { name: "Alfien", team: "Man City" }
]

// Match Data from User Request
const MATCH_DATA = [
    {
        home: "Arshad", away: "Basil",
        score: [0, 2],
        xg: [1.7, 0.9],
        possession: [50, 50],
        tackles: [18, 9],
        interceptions: [14, 8],
        motm: "Basil", rating: [null, 8.6],
        winner: "Basil"
    },
    {
        home: "Alex", away: "Ruban",
        score: [4, 5],
        xg: [null, null],
        possession: [54, 46],
        tackles: [9, 41],
        interceptions: [9, 12],
        motm: "Ruban", rating: [null, 10.0],
        winner: "Ruban"
    },
    {
        home: "Alfien", away: "Ruban",
        score: [1, 5],
        xg: [1.5, 6.5],
        possession: [45, 55],
        tackles: [28, 33],
        interceptions: [5, 13],
        motm: "Ruban", rating: [null, 9.2],
        winner: "Ruban"
    },
    {
        home: "Alex", away: "Arshad",
        score: [3, 4],
        xg: [3.2, 3.6],
        possession: [57, 43],
        tackles: [12, 14],
        interceptions: [19, 13],
        motm: "Arshad", rating: [null, 10.0],
        winner: "Arshad"
    },
    {
        home: "Alfien", away: "Basil",
        score: [3, 4],
        xg: [3.4, 4.1],
        possession: [52, 48],
        tackles: [41, 16],
        interceptions: [9, 21],
        motm: "Basil", rating: [null, 10.0],
        winner: "Basil"
    },
    {
        home: "Arshad", away: "Ruban",
        score: [4, 3],
        xg: [2.8, 2.8],
        possession: [52, 48],
        tackles: [9, 30],
        interceptions: [8, 13],
        motm: "Arshad", rating: [10.0, null],
        winner: "Arshad"
    },
    {
        home: "Alex", away: "Basil",
        score: [3, 2],
        xg: [2.0, 1.2],
        possession: [52, 48],
        tackles: [14, 16],
        interceptions: [8, 9],
        motm: "Basil", rating: [null, 8.9],
        winner: "Alex"
    },
    {
        home: "Arshad", away: "Alfien",
        score: [8, 4],
        xg: [7.6, 5.6],
        possession: [45, 55],
        tackles: [20, 21],
        interceptions: [8, 12],
        motm: "Arshad", rating: [10.0, null],
        winner: "Arshad"
    }
]

async function main() {
    console.log("Starting Season 5 Seed...");

    // 1. Create Tournament First
    const tournament = await prisma.tournament.create({
        data: {
            name: "Season 5 League",
            format: "league",
            status: "active",
            adminPin: "1234"
        }
    });
    console.log(`Created Tournament: ${tournament.name} (${tournament.id})`);

    // 2. Create Players for this specific tournament
    const playerMap = new Map<string, string>(); // Name -> ID

    for (const p of PLAYERS) {
        // Create new player entry scoped to this tournament
        const player = await prisma.player.create({
            data: {
                name: p.name,
                team: p.team,
                tournamentId: tournament.id
            }
        });
        playerMap.set(p.name, player.id);
        console.log(`Created player: ${p.name}`);
    }

    // 3. Create Matches
    let roundInfo = 1;

    for (const m of MATCH_DATA) {
        const homeId = playerMap.get(m.home)!;
        const awayId = playerMap.get(m.away)!;

        // Determine if home or away is MOTM for boolean
        const homeIsMotm = m.motm === m.home;
        const awayIsMotm = m.motm === m.away;

        // Ratings
        const homeRating = m.rating[0] ?? 6.0;
        const awayRating = m.rating[1] ?? 6.0;

        await prisma.match.create({
            data: {
                tournamentId: tournament.id,
                roundNumber: roundInfo++,
                homePlayerId: homeId,
                awayPlayerId: awayId,
                homeScore: m.score[0],
                awayScore: m.score[1],
                isPlayed: true,

                // Stats
                homeXg: m.xg[0],
                awayXg: m.xg[1],
                homePossession: m.possession[0],
                awayPossession: m.possession[1],
                homeTackles: m.tackles[0],
                awayTackles: m.tackles[1],
                homeInterceptions: m.interceptions[0],
                awayInterceptions: m.interceptions[1],

                homeRating: homeRating,
                awayRating: awayRating,
                homeIsMotm: homeIsMotm,
                awayIsMotm: awayIsMotm
            }
        });
        console.log(`Created match: ${m.home} vs ${m.away} (${m.score[0]}-${m.score[1]})`);
    }

    console.log("Season 5 Seeding Complete!");
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect())
