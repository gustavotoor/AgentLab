import { PrismaClient } from '@prisma/client'

/**
 * Global Prisma client singleton to prevent multiple instances during hot reloads in development.
 * Uses a global variable to persist the client across module reloads.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/** Shared Prisma client instance */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
