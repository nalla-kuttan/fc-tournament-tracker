import { PrismaClient } from '@prisma/client'

declare global {
    var prisma: PrismaClient | undefined
}

const prisma = globalThis.prisma ?? new PrismaClient()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
