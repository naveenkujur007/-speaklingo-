// NVIDIA NIM API configuration.
//
// NVIDIA NIM provides OpenAI-compatible API for LLM chat completions.
// Free tier available, public API accessible from any cloud (incl. Vercel).
//
// Models we use:
// - deepseek-ai/deepseek-v4.1-flash — fast general-purpose chat
// - meta/llama-3.2-90b-vision-instruct — for vision (image) tasks (if needed)
//
// API docs: https://docs.api.nvidia.com/nim/reference

export const NVIDIA_CONFIG = {
  // Public API endpoint (works from any cloud, including Vercel)
  baseUrl: "https://integrate.api.nvidia.com/v1",
  // User's API key (env var takes precedence, hardcoded fallback below)
  apiKey:
    process.env.NVIDIA_API_KEY ||
    "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",
  // Default model (fast, free tier friendly)
  defaultModel: "deepseek-ai/deepseek-v4.1-flash",
};
