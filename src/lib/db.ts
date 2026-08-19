import { PrismaClient } from '@prisma/client'

// Global Prisma singleton — prevents multiple instances in dev.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// On Vercel/Netlify, SQLite won't persist. The DATABASE_URL should point
// to PostgreSQL (e.g., Supabase) in production. If the DB is unavailable,
// API routes catch errors and fall back gracefully (lessons generate fresh,
// chat works without session persistence).
function createPrismaClient(): PrismaClient | null {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error'] : [],
    })
  } catch (e) {
    console.error('Failed to create Prisma client:', e)
    return null
  }
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production' && !globalForPrisma.prisma) {
  globalForPrisma.prisma = db
}

// Helper: check if DB is usable (not null).
export function isDbAvailable(): boolean {
  return !!db
}
