// Z-AI SDK configuration values.
//
// These are needed by the z-ai-web-dev-sdk to authenticate with the
// Z.ai API. The SDK normally reads a `.z-ai-config` file on disk, but
// Vercel's serverless filesystem is ephemeral, so we hard-code the
// config here instead.
//
// SECURITY NOTE:
// - These values belong to the project owner (Naveen).
// - The repo is private (only owner has access).
// - If the repo is made public in the future, move these to env vars.

export const ZAI_CONFIG = {
  baseUrl: "https://internal-api.z.ai/v1",
  apiKey: "Z.ai",
  token:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOGQ1NDQyMTMtOWU5Yy00ZTJiLWI4ZGItMjIzMWM4Yzc0ODk1IiwiY2hhdF9pZCI6ImNoYXQtOTQxMmExYTEtNmFmNi00MmFmLTllYzAtNGU5MGM2NWE2ZTI2IiwicGxhdGZvcm0iOiJ6YWkifQ.z-ETq8DMGZ2rz1ZpTxlxBgmpXcYgOgTPLQIrxPY-dSo",
  userId: "8d544213-9e9c-4e2b-b8db-2231c8c74895",
  chatId: "chat-9412a1a1-6af6-42af-9ec0-4e90c65a6e26",
};
