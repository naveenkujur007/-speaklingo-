// Server-side ZAI SDK initialization wrapper.
//
// The z-ai-web-dev-sdk normally reads a `.z-ai-config` JSON file from disk:
//   /etc/.z-ai-config  →  ~/.z-ai-config  →  ./.z-ai-config
// But on Vercel (and other serverless platforms) the filesystem is read-only
// or ephemeral, so the file won't exist. We work around this by:
//
// 1. If a config file already exists (dev machine), use ZAI.create() as-is.
// 2. If env vars are present (production), write a temp config file and
//    point the SDK at it by overriding the config loader.
// 3. Otherwise, throw a clear error explaining what to do.
//
// Required env vars (only when running on Vercel/production):
//   ZAI_API_KEY  — your z-ai-web-dev-sdk API key
//   ZAI_BASE_URL — e.g. https://internal-api.z.ai/v1
//   ZAI_TOKEN    — JWT token from z.ai
//   ZAI_USER_ID  — your user id
//   ZAI_CHAT_ID  — chat id
//
// To get these values, copy them from your local /etc/.z-ai-config file
// and add them to Vercel Environment Variables.

import fs from "fs";
import path from "path";
import os from "os";
import ZAI from "z-ai-web-dev-sdk";

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;
let initError: string | null = null;

const TEMP_CONFIG_PATH = path.join(os.tmpdir(), ".z-ai-config-vercel");

function tryReadConfigFile(): { baseUrl: string; apiKey: string; token?: string; chatId?: string; userId?: string } | null {
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

function writeConfigFromEnv(): boolean {
  const apiKey = process.env.ZAI_API_KEY;
  const baseUrl = process.env.ZAI_BASE_URL || "https://internal-api.z.ai/v1";
  const token = process.env.ZAI_TOKEN;
  const userId = process.env.ZAI_USER_ID;
  const chatId = process.env.ZAI_CHAT_ID;
  if (!apiKey) return false;
  const cfg = { baseUrl, apiKey, token, userId, chatId };
  try {
    fs.writeFileSync(TEMP_CONFIG_PATH, JSON.stringify(cfg), { mode: 0o600 });
    return true;
  } catch {
    return false;
  }
}

export async function getZAI(): Promise<Awaited<ReturnType<typeof ZAI.create>>> {
  if (zaiInstance) return zaiInstance;
  if (initError) throw new Error(initError);

  // Try reading the existing config file
  let cfg = tryReadConfigFile();

  // If no config file and we have env vars, write a temp config file
  if (!cfg) {
    const wrote = writeConfigFromEnv();
    if (wrote) {
      cfg = tryReadConfigFile();
    }
  }

  if (!cfg) {
    initError =
      "ZAI SDK config not found. Either: (1) place a .z-ai-config file in the project root, your home dir, or /etc/, OR (2) set ZAI_API_KEY (+ optional ZAI_BASE_URL, ZAI_TOKEN, ZAI_USER_ID, ZAI_CHAT_ID) env vars. On Vercel, add these in Project Settings → Environment Variables.";
    throw new Error(initError);
  }

  // Trick: temporarily point CWD to where our temp config file lives, so
  // the SDK's loadConfig finds it. Then restore CWD.
  const originalCwd = process.cwd();
  if (!fs.existsSync(path.join(originalCwd, ".z-ai-config")) && fs.existsSync(TEMP_CONFIG_PATH)) {
    // The SDK reads /etc/.z-ai-config first, then home, then cwd. Since /etc
    // is read-only on Vercel and home is ephemeral, we write the file to
    // /tmp (os.tmpdir()) and symlink-or-copy it as ~/.z-ai-config.
    try {
      const home = os.homedir();
      fs.copyFileSync(TEMP_CONFIG_PATH, path.join(home, ".z-ai-config"));
    } catch {
      // Last-ditch: write to cwd (works in some serverless containers)
      try {
        fs.copyFileSync(TEMP_CONFIG_PATH, path.join(originalCwd, ".z-ai-config"));
      } catch {}
    }
  }

  try {
    zaiInstance = await ZAI.create();
    return zaiInstance;
  } catch (err) {
    initError = err instanceof Error ? err.message : String(err);
    throw err;
  }
}

export default ZAI;
