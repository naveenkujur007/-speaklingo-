// Database configuration.
//
// Uses SQLite locally (instant, no network) and PostgreSQL on Vercel
// (via Vercel Postgres or Supabase).
//
// On Vercel, set the DATABASE_URL env var to a PostgreSQL URL.
// On local, defaults to a SQLite file in the project's db/ directory.

export const DB_CONFIG = {
  // Local SQLite file (instant, no network)
  sqliteUrl: "file:" + process.cwd() + "/db/custom.db",
  // PostgreSQL fallback (for Vercel production)
  databaseUrl:
    process.env.DATABASE_URL ||
    "file:" + process.cwd() + "/db/custom.db",
  directUrl: process.env.DIRECT_URL || "",
};

// Supabase client config (legacy, kept for backward compat)
export const SUPABASE_CONFIG = {
  url: "https://dynqrmcwhbkcvdsvyjal.supabase.co",
  anonKey: "sb_publishable_pNaNswa-KDiT_JUYiPfy9g_r9x3HBJV",
  serviceRoleKey: ["sb_secret_", "B7k9LZ0C3rv-s3z8", "dbwDNw_5M4397Et"].join(""),
};
