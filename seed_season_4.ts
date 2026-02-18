
import { PrismaClient } from '@prisma/client'

// Use absolute path for safety
process.env.DATABASE_URL = "file:/Users/ruban/.gemini/antigravity/playground/inner-celestial/prisma/prisma/dev.db"

const prisma = new PrismaClient()

// Based on most frequent team usage
const PLAYERS = [
    { name: "Basil", team: "PSG" },
    { name: "Moamen", team: "Real Madrid" },
    { name: "Ruban", team: "Chelsea" },
    { name: "Arshad", team: "PSG" },
    { name: "Alex", team: "Man City" }
]

const MATCH_DATA = [
    // Match 1: Basil (PSG) vs Moamen (RM)
    {
        round: 1,
        home: "Basil", away: "Moamen",
        score: [3, 2],
        possession: [50, 50],
        xg: [3.6, 2.2],
        tackles: [10, 6],
        tacklesWon: [10, 6], // Assuming 100% win if not specified or same? User said "Tackles (Won): 10", assume total tackles = won for now or just set won.
        // User data: "Tackles (Won): 10". I will map this to `homeTackles`.
        interceptions: [0, 0], // N/A in user data
        rating: [9.3, 7.8],
        motm: "Basil"
    },
    // Match 2: Ruban (Chelsea) vs Arshad (PSG)
    {
        round: 1,
        home: "Ruban", away: "Arshad",
        score: [3, 1],
        possession: [50, 50],
        xg: [3.1, 0.8],
        tackles: [2, 3], // Won
        interceptions: [14, 8],
        rating: [9.8, 7.5],
        motm: "Ruban"
    },
    // Match 3: Basil (PSG) vs Alex (Bayern) -> Alex uses Man City in DB
    {
        round: 2,
        home: "Basil", away: "Alex",
        score: [2, 1],
        possession: [48, 52],
        xg: [4.0, 2.8],
        tackles: [11, 3],
        interceptions: [10, 9],
        rating: [9.2, 8.2],
        motm: "Basil"
    },
    // Match 4: Arshad (PSG) vs Moamen (RM)
    {
        round: 2,
        home: "Arshad", away: "Moamen",
        score: [5, 0],
        possession: [56, 44],
        xg: [3.8, 0.2],
        tackles: [12, 5],
        interceptions: [7, 8],
        rating: [8.7, 5.7],
        motm: "Arshad"
    },
    // Match 5: Ruban (Chelsea) vs Alex (RM) -> Alex uses Man City in DB
    {
        round: 3,
        home: "Ruban", away: "Alex",
        score: [5, 6], // Alex won 6-5
        possession: [45, 55],
        xg: [4.0, 3.8],
        tackles: [11, 7],
        interceptions: [9, 9],
        rating: [8.9, 8.8],
        motm: "Alex"
    },
    // Match 6: Basil (Man City) vs Arshad (PSG) -> Basil uses PSG in DB
    {
        round: 3,
        home: "Basil", away: "Arshad",
        score: [4, 3],
        possession: [50, 50],
        xg: [2.5, 3.2],
        tackles: [10, 4],
        interceptions: [14, 14],
        rating: [10.0, 8.9],
        motm: "Basil"
    },
    // Match 7: Moamen (RM) vs Ruban (Chelsea)
    {
        round: 4,
        home: "Moamen", away: "Ruban",
        score: [1, 5], // Ruban won 5-1
        possession: [50, 50],
        xg: [2.7, 4.6],
        tackles: [6, 6],
        interceptions: [8, 5],
        rating: [7.8, 9.6],
        motm: "Ruban"
    },
    // Match 8: Arshad (PSG) vs Alex (Man City)
    {
        round: 4,
        home: "Arshad", away: "Alex",
        score: [4, 6], // Alex won 6-4
        possession: [45, 55],
        xg: [2.4, 4.2],
        tackles: [7, 6],
        interceptions: [10, 13],
        rating: [10.0, 9.8],
        motm: "Alex"
    },
    // Match 9: Moamen (PSG) vs Alex (Man City) -> Moamen uses RM in DB
    {
        round: 5,
        home: "Moamen", away: "Alex",
        score: [5, 5],
        possession: [48, 52],
        xg: [3.7, 4.4],
        tackles: [12, 5],
        interceptions: [7, 10],
        rating: [10.0, 10.0],
        motm: "Alex" // MOTM: Erling Haaland (Alex)
    },
    // Match 10: Ruban (Chelsea) vs Basil (PSG)
    {
        round: 5,
        home: "Ruban", away: "Basil",
        score: [5, 4],
        possession: [55, 45],
        xg: [2.6, 3.1],
        tackles: [7, 3],
        interceptions: [8, 12],
        rating: [9.6, 10.0],
        motm: "Ruban"
    }
]

async function main() {
    console.log('Seeding Season 4 Data...')

    // 1. Create Tournament
    const tournament = await prisma.tournament.create({
        data: {
            name: "Season 4 League",
            format: "league",
            status: "active",
            adminPin: "1234"
        }
    })
    console.log('Created Tournament:', tournament.name)

    // 2. Create Players
    const playerMap = new Map()
    for (const p of PLAYERS) {
        // Create player specifically for this tournament
        const player = await prisma.player.create({
            data: {
                name: p.name,
                team: p.team,
                tournamentId: tournament.id
            }
        })
        playerMap.set(p.name, player)

        // Update global registry (optional, but good for history)
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

        if (!pHome || !pAway) {
            console.error(`Player not found for match: ${m.home} vs ${m.away}`)
            continue
        }

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
                homeXg: m.xg[0],
                homePossession: m.possession[0],
                homeTackles: m.tackles[0],
                homeInterceptions: m.interceptions[0],
                homeRating: m.rating[0],
                homeIsMotm: m.motm === m.home,

                // Away Stats
                awayXg: m.xg[1],
                awayPossession: m.possession[1],
                awayTackles: m.tackles[1],
                awayInterceptions: m.interceptions[1],
                awayRating: m.rating[1],
                awayIsMotm: m.motm === m.away,
            }
        })

        // Generate Goals
        if (m.score[0] > 0) {
            await prisma.goal.createMany({
                data: Array(m.score[0]).fill(0).map(() => ({
                    matchId: match.id,
                    playerId: pHome.id,
                    side: "home",
                    minute: Math.floor(Math.random() * 90) + 1
                }))
            })
        }

        if (m.score[1] > 0) {
            await prisma.goal.createMany({
                data: Array(m.score[1]).fill(0).map(() => ({
                    matchId: match.id,
                    playerId: pAway.id,
                    side: "away",
                    minute: Math.floor(Math.random() * 90) + 1
                }))
            })
        }

        console.log(`Match seeded: ${m.home} vs ${m.away} (${m.score[0]}-${m.score[1]})`)
    }
    console.log('Seeding complete.')
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
