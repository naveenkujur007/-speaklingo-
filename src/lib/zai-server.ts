// Server-side LLM initialization wrapper.
//
// Originally this used z-ai-web-dev-sdk, but that SDK uses internal-api.z.ai
// which is only reachable from Z.ai's own cloud (private IP). On Vercel and
// other public clouds, all LLM calls failed with "fetch failed".
//
// Solution: We replaced the ZAI SDK with a drop-in wrapper that calls
// NVIDIA NIM (public OpenAI-compatible API). The interface is identical:
//   const z = await getZAI();
//   const r = await z.chat.completions.create({ messages, ... });
//   const text = r.choices[0]?.message?.content;
//
// So existing API routes don't need to change their call patterns.
//
// For DB env vars (still set here for backward compat with db.ts)
import { DB_CONFIG } from "@/config/db-config";
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = DB_CONFIG.databaseUrl;
if (!process.env.DIRECT_URL) process.env.DIRECT_URL = DB_CONFIG.directUrl;

// Re-export the LLM client (NVIDIA-backed, mimics ZAI SDK interface)
export { getZAI, default } from "@/lib/llm-server";
