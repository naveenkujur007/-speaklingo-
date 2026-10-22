// Server-side ZAI SDK initialization wrapper.
//
// The z-ai-web-dev-sdk normally reads a `.z-ai-config` JSON file from disk
// via its `ZAI.create()` static method. On Vercel (serverless, ephemeral
// filesystem), this fails because the file doesn't exist.
//
// Solution: bypass `ZAI.create()` entirely. Construct the ZAI instance
// directly with the hardcoded config from `src/config/zai-config.ts`.
//
// The ZAI class is exported as default from the SDK — we can `new ZAI(cfg)`
// directly, which is exactly what `ZAI.create()` does internally after
// loading the config file.
//
// If env vars are set (ZAI_API_KEY etc), they take precedence over the
// hardcoded values.

import ZAI from "z-ai-web-dev-sdk";
import { ZAI_CONFIG } from "@/config/zai-config";
import { DB_CONFIG } from "@/config/db-config";

// Lazy singleton
let zaiInstance: ZAI | null = null;
let initError: string | null = null;

// Set process.env so any other code that reads env vars still works
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = DB_CONFIG.databaseUrl;
if (!process.env.DIRECT_URL) process.env.DIRECT_URL = DB_CONFIG.directUrl;

export async function getZAI(): Promise<ZAI> {
  if (zaiInstance) return zaiInstance;
  if (initError) throw new Error(initError);

  // Build config — env vars override hardcoded
  const apiKey = process.env.ZAI_API_KEY || ZAI_CONFIG.apiKey;
  const baseUrl = process.env.ZAI_BASE_URL || ZAI_CONFIG.baseUrl;
  const token = process.env.ZAI_TOKEN || ZAI_CONFIG.token;
  const userId = process.env.ZAI_USER_ID || ZAI_CONFIG.userId;
  const chatId = process.env.ZAI_CHAT_ID || ZAI_CONFIG.chatId;

  if (!apiKey || !baseUrl) {
    initError =
      "ZAI SDK requires apiKey and baseUrl. Set ZAI_API_KEY/ZAI_BASE_URL env vars or update src/config/zai-config.ts.";
    throw new Error(initError);
  }

  try {
    // Construct ZAI directly with the config (bypasses the file loader)
    // The SDK class accepts a config object as its constructor argument.
    zaiInstance = new ZAI({ baseUrl, apiKey, token, userId, chatId });
    return zaiInstance;
  } catch (err) {
    initError = err instanceof Error ? err.message : String(err);
    throw err;
  }
}

export default ZAI;
