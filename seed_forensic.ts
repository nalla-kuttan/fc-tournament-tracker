
import { PrismaClient } from '@prisma/client'

// Use absolute path for safety, similar to diag script
process.env.DATABASE_URL = "file:/Users/ruban/.gemini/antigravity/playground/inner-celestial/prisma/prisma/dev.db"

const prisma = new PrismaClient()

const PLAYERS = [
    { name: "Ruban", team: "Man City" },
    { name: "Basil", team: "FC Barcelona" }, // Primary team
    { name: "Alex", team: "Chelsea" },
    { name: "Arshad", team: "PSG" },
    { name: "Moamen", team: "Arsenal" }
]

const MATCH_DATA = [
    // Round 1
    {
        round: 1,
        home: "Ruban", away: "Basil",
        homeTeam: "Man City", awayTeam: "Liverpool", // Special case for Basil
        score: [4, 2],
        possession: [47, 53],
        xg: [2.9, 2.6],
        shots: [10, 7],
        passes: [83, 100],
        tackles: [37, 7],
        tacklesWon: [10, 4],
        interceptions: [9, 8],
        motm: "Ruban", rating: [9.5, null], // Ruban rating known
        goals: { home: 4, away: 2 } // Goals to create strings/records
    },
    {
        round: 1,
        home: "Alex", away: "Arshad",
        homeTeam: "Chelsea", awayTeam: "PSG",
        score: [5, 3],
        possession: [56, 44],
        xg: [2.7, 2.7],
        shots: [6, 5],
        passes: [118, 126],
        tackles: [9, 21],
        tacklesWon: [5, 4],
        interceptions: [13, 6],
        motm: "Arshad", rating: [null, 10.0], // MOTM on losing team (Arshad)
        goals: { home: 5, away: 3 }
    },
    // Round 2
    {
        round: 2,
        home: "Basil", away: "Moamen",
        homeTeam: "FC Barcelona", awayTeam: "Arsenal",
        score: [2, 3], // Arsenal 3 - 2 Barcelona (Away Win)
        possession: [44, 56],
        xg: [2.2, 1.9],
        shots: [10, 7],
        passes: [80, 133],
        tackles: [7, 6],
        tacklesWon: [6, 6],
        interceptions: [15, 7],
        motm: "Moamen", rating: [null, 10.0],
        goals: { home: 2, away: 3 }
    },
    {
        round: 2,
        home: "Ruban", away: "Alex",
        homeTeam: "Man City", awayTeam: "Chelsea",
        score: [2, 6], // Chelsea 6 - 2 Man City (Away Win)
        possession: [41, 59],
        xg: [2.1, 5.0],
        shots: [5, 12],
        passes: [54, 109],
        tackles: [42, 6],
        tacklesWon: [7, 4],
        interceptions: [8, 7],
        motm: "Alex", rating: [null, 10.0],
        goals: { home: 2, away: 6 }
    },
    // Round 3
    {
        round: 3,
        home: "Alex", away: "Moamen",
        homeTeam: "Chelsea", awayTeam: "Arsenal",
        score: [4, 1],
        possession: [48, 52],
        xg: [2.2, 1.1],
        shots: [6, 6],
        passes: [87, 112],
        tackles: [10, 5],
        tacklesWon: [4, 4],
        interceptions: [9, 8],
        motm: "Alex", rating: [9.8, null],
        goals: { home: 4, away: 1 }
    },
    {
        round: 3,
        home: "Ruban", away: "Arshad",
        homeTeam: "Man City", awayTeam: "PSG",
        score: [3, 5], // PSG 5 - 3 Man City (Away Win)
        possession: [47, 53],
        xg: [1.8, 3.4],
        shots: [6, 10],
        passes: [55, 123],
        tackles: [20, 12],
        tacklesWon: [1, 5],
        interceptions: [12, 7],
        motm: "Arshad", rating: [null, 10.0],
        goals: { home: 3, away: 5 }
    },
    // Round 4
    {
        round: 4,
        home: "Basil", away: "Arshad",
        homeTeam: "FC Barcelona", awayTeam: "PSG",
        score: [3, 0],
        possession: [50, 50],
        xg: [3.8, 0.0],
        shots: [7, 0],
        passes: [101, 134],
        tackles: [14, 16],
        tacklesWon: [10, 9],
        interceptions: [15, 8],
        motm: "Basil", rating: [8.8, null],
        goals: { home: 3, away: 0 }
    },
    {
        round: 4,
        home: "Ruban", away: "Moamen",
        homeTeam: "Man City", awayTeam: "Arsenal",
        score: [1, 4], // Arsenal 4 - 1 Man City (Away Win)
        possession: [43, 57],
        xg: [2.2, 3.1],
        shots: [6, 6],
        passes: [61, 103],
        tackles: [7, 20],
        tacklesWon: [2, 7],
        interceptions: [10, 9],
        motm: "Moamen", rating: [null, 10.0],
        goals: { home: 1, away: 4 }
    },
    // Round 5
    {
        round: 5,
        home: "Basil", away: "Alex",
        homeTeam: "FC Barcelona", awayTeam: "Chelsea",
        score: [3, 5], // Chelsea 5 - 3 Barcelona (Away Win)
        possession: [42, 58],
        xg: [1.0, 3.9],
        shots: [3, 8],
        passes: [84, 115],
        tackles: [12, 16],
        tacklesWon: [4, 10],
        interceptions: [11, 7],
        motm: "Alex", rating: [null, 10.0],
        goals: { home: 3, away: 5 }
    },
    {
        round: 5,
        home: "Arshad", away: "Moamen",
        homeTeam: "PSG", awayTeam: "Arsenal",
        score: [1, 2], // Arsenal 2 - 1 PSG (Away Win)
        possession: [44, 56],
        xg: [2.5, 1.7],
        shots: [6, 5],
        passes: [104, 113],
        tackles: [15, 15],
        tacklesWon: [7, 14],
        interceptions: [12, 10],
        motm: "Moamen", rating: [null, 8.7],
        goals: { home: 1, away: 2 }
    }
]

async function main() {
    console.log('Seeding Forensic Data...')

    // 1. Create Tournament
    const tournament = await prisma.tournament.create({
        data: {
            name: "Forensic Analysis League",
            format: "league",
            status: "active",
            adminPin: "1234"
        }
    })
    console.log('Created Tournament:', tournament.name)

    // 2. Create Players for this tournament
    const playerMap = new Map()
    for (const p of PLAYERS) {
        const player = await prisma.player.create({
            data: {
                name: p.name,
                team: p.team,
                tournamentId: tournament.id
            }
        })
        playerMap.set(p.name, player)

        // Also ensure RegisteredPlayer exists
        await prisma.registeredPlayer.upsert({
            where: { name: p.name },
            update: { team: p.team },
            create: { name: p.name, team: p.team }
        })
    }
    console.log('Players seeded.')

    // 3. Create Matches
    for (const m of MATCH_DATA) {
        const pHome = playerMap.get(m.home)
        const pAway = playerMap.get(m.away)

        const match = await prisma.match.create({
            data: {
                tournamentId: tournament.id,
                roundNumber: m.round,
                homePlayerId: pHome.id,
                awayPlayerId: pAway.id,

                // Score
                homeScore: m.score[0],
                awayScore: m.score[1],
                isPlayed: true,

                // Home Stats
                homePossession: m.possession[0],
                homeXg: m.xg[0],
                homeTackles: m.tackles[0],
                homeInterceptions: m.interceptions[0],
                homeRating: m.rating[0] ?? 6.0,
                homeIsMotm: m.motm === m.home,

                // Away Stats
                awayPossession: m.possession[1],
                awayXg: m.xg[1],
                awayTackles: m.tackles[1],
                awayInterceptions: m.interceptions[1],
                awayRating: m.rating[1] ?? 6.0,
                awayIsMotm: m.motm === m.away,
            }
        })

        // Goals
        if (m.goals.home > 0) {
            await prisma.goal.createMany({
                data: Array(m.goals.home).fill(0).map(() => ({
                    matchId: match.id,
                    playerId: pHome.id,
                    side: "home",
                    minute: Math.floor(Math.random() * 90) + 1
                }))
            })
        }

        if (m.goals.away > 0) {
            await prisma.goal.createMany({
                data: Array(m.goals.away).fill(0).map(() => ({
                    matchId: match.id,
                    playerId: pAway.id,
                    side: "away",
                    minute: Math.floor(Math.random() * 90) + 1
                }))
            })
        }

        console.log(`Match seeded: ${m.home} vs ${m.away} (${m.score[0]}-${m.score[1]})`)
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
