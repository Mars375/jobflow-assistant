/**
 * Prisma client singleton.
 * Re-uses connection in development to prevent connection exhaustion.
 * Requires: prisma generate to have been run (plan 01-01).
 */
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
