
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    // players
    const players = [
        { name: 'Ruban', team: 'Liverpool' },
        { name: 'Basil', team: 'Man City' },
        { name: 'Alice', team: 'Arsenal' },
        { name: 'Bob', team: 'Real Madrid' }
    ]

    for (const p of players) {
        await prisma.registeredPlayer.upsert({
            where: { name: p.name },
            update: { team: p.team },
            create: {
                name: p.name,
                team: p.team,
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
                tournamentsPlayedJson: "[]"
            }
        })
    }

    console.log('Seed completed successfully.')
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
