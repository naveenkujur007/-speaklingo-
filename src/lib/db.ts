import { PrismaClient } from "@prisma/client";
import { DB_CONFIG } from "@/config/db-config";

// Set DATABASE_URL from hardcoded config if env var is missing (Vercel
// doesn't have env vars set by default — this makes it work out of box).
// Must run BEFORE any PrismaClient instantiation.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DB_CONFIG.databaseUrl;
}
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = DB_CONFIG.directUrl;
}

// Global Prisma singleton — prevents multiple instances in dev.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient | null {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error"] : [],
    });
  } catch (e) {
    console.error("Failed to create Prisma client:", e);
    return null;
  }
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production" && !globalForPrisma.prisma) {
  globalForPrisma.prisma = db;
}

// Helper: check if DB is usable (not null).
export function isDbAvailable(): boolean {
  return !!db;
}
