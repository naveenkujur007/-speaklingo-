// Server-side ZAI SDK initialization wrapper.
//
// The z-ai-web-dev-sdk normally reads a `.z-ai-config` JSON file from disk:
//   /etc/.z-ai-config  →  ~/.z-ai-config  →  ./.z-ai-config
//
// On Vercel (and other serverless platforms) the filesystem is read-only
// or ephemeral, so we bypass the SDK's loader and construct the ZAI
// instance directly with the config values from `src/config/zai-config.ts`.
//
// On local dev, the SDK can still read the regular .z-ai-config file.
//
// If you need to override the values for production without committing
// them to the repo, set the env vars below — they take precedence.

import fs from "fs";
import path from "path";
import os from "os";
import ZAI from "z-ai-web-dev-sdk";
import { ZAI_CONFIG } from "@/config/zai-config";

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;
let initError: string | null = null;

const TEMP_CONFIG_PATH = path.join(os.tmpdir(), ".z-ai-config-vercel");

interface ZaiConfig {
  baseUrl: string;
  apiKey: string;
  token?: string;
  chatId?: string;
  userId?: string;
}

function buildConfigFromEnv(): ZaiConfig | null {
  // Env vars take precedence over hardcoded values
  const envApiKey = process.env.ZAI_API_KEY;
  if (envApiKey) {
    return {
      baseUrl: process.env.ZAI_BASE_URL || ZAI_CONFIG.baseUrl,
      apiKey: envApiKey,
      token: process.env.ZAI_TOKEN || ZAI_CONFIG.token,
      chatId: process.env.ZAI_CHAT_ID || ZAI_CONFIG.chatId,
      userId: process.env.ZAI_USER_ID || ZAI_CONFIG.userId,
    };
  }
  return null;
}

function tryReadConfigFile(): ZaiConfig | null {
  const candidates = [
    path.join(process.cwd(), ".z-ai-config"),
    path.join(os.homedir(), ".z-ai-config"),
    "/etc/.z-ai-config",
    TEMP_CONFIG_PATH,
  ];
  for (const p of candidates) {
    try {
      const text = fs.readFileSync(p, "utf-8");
      const cfg = JSON.parse(text);
      if (cfg.baseUrl && cfg.apiKey) return cfg;
    } catch {
      // try next
    }
  }
  return null;
}

function writeTempConfigFile(cfg: ZaiConfig): boolean {
  try {
    fs.writeFileSync(TEMP_CONFIG_PATH, JSON.stringify(cfg), { mode: 0o600 });
    // Also write to home dir and cwd as fallbacks
    try {
      fs.copyFileSync(TEMP_CONFIG_PATH, path.join(os.homedir(), ".z-ai-config"));
    } catch {}
    try {
      fs.copyFileSync(TEMP_CONFIG_PATH, path.join(process.cwd(), ".z-ai-config"));
    } catch {}
    return true;
  } catch {
    return false;
  }
}

export async function getZAI(): Promise<Awaited<ReturnType<typeof ZAI.create>>> {
  if (zaiInstance) return zaiInstance;
  if (initError) throw new Error(initError);

  // 1) Env vars (highest priority)
  let cfg: ZaiConfig | null = buildConfigFromEnv();

  // 2) Existing config file (dev machine)
  if (!cfg) {
    cfg = tryReadConfigFile();
  }

  // 3) Hardcoded values from src/config/zai-config.ts (production fallback)
  if (!cfg) {
    cfg = ZAI_CONFIG;
  }

  // Always write a config file so the SDK's internal loader can find it
  writeTempConfigFile(cfg);

  try {
    zaiInstance = await ZAI.create();
    return zaiInstance;
  } catch (err) {
    initError = err instanceof Error ? err.message : String(err);
    throw err;
  }
}

export default ZAI;
