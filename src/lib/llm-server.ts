// NVIDIA NIM LLM client — drop-in replacement for z-ai-web-dev-sdk.
//
// Why: The z-ai-web-dev-sdk uses internal-api.z.ai which is only reachable
// from Z.ai's own cloud. On Vercel/public cloud, those LLM calls fail with
// "fetch failed". NVIDIA NIM is a public OpenAI-compatible API that works
// everywhere.
//
// This module mimics the z-ai-web-dev-sdk's interface:
//   const z = await getZAI();
//   const r = await z.chat.completions.create({ messages, ... });
//   const text = r.choices[0]?.message?.content;
//
// But under the hood, it calls NVIDIA NIM instead. So existing API routes
// don't need to change their call pattern — only the import changed
// (which we already centralized in src/lib/zai-server.ts).

import { NVIDIA_CONFIG } from "@/config/nvidia-config";

// Interface mimicking z-ai-web-dev-sdk's chat.completions shape
export interface ChatMessage {
  role: "system" | "user" | "assistant" | "developer" | "tool";
  content: string;
}

export interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string | null;
      reasoning_content?: string;
    };
    finish_reason: string;
  }>;
  created: number;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  // Accept z-ai-web-dev-sdk's `thinking` param (ignored by NVIDIA)
  thinking?: { type: string };
  // Accept any other params
  [key: string]: unknown;
}

// Singleton instance (mimics z-ai-web-dev-sdk pattern)
let instance: NvidiaLLMClient | null = null;

export class NvidiaLLMClient {
  private baseUrl: string;
  private apiKey: string;
  private defaultModel: string;

  constructor(config: { baseUrl: string; apiKey: string; defaultModel: string }) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel;
  }

  // Mimics ZAI.chat.completions interface
  chat = {
    completions: {
      create: async (req: ChatCompletionRequest): Promise<ChatCompletionResponse> => {
        const model = req.model || this.defaultModel;
        // Strip params NVIDIA doesn't support
        const body: Record<string, unknown> = {
          model,
          messages: req.messages,
        };
        if (req.max_tokens !== undefined) body.max_tokens = req.max_tokens;
        if (req.temperature !== undefined) body.temperature = req.temperature;
        if (req.top_p !== undefined) body.top_p = req.top_p;
        // Disable thinking by default for fast responses (DeepSeek supports it)
        if (!req.thinking) {
          body.chat_template_kwargs = { thinking: false };
        }

        const url = `${this.baseUrl}/chat/completions`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(
            `NVIDIA NIM API error (${res.status}): ${errText.substring(0, 300)}`
          );
        }

        const json = (await res.json()) as ChatCompletionResponse;
        // Make sure content is non-null
        if (json.choices?.[0]?.message?.content === null) {
          // DeepSeek sometimes returns content in reasoning_content when
          // thinking is enabled. Use that as fallback.
          const reasoning = json.choices[0]?.message?.reasoning_content;
          if (reasoning) {
            json.choices[0].message.content = reasoning;
          }
        }
        return json;
      },
    },
  };

  // Mimics ZAI.audio.tts.create (we'll fall back to a placeholder since
  // NVIDIA NIM doesn't have TTS — actual TTS uses Google Translate proxy)
  audio = {
    tts: {
      create: async () => {
        throw new Error("TTS not supported by NVIDIA NIM — use /api/tts-proxy");
      },
    },
    asr: {
      create: async () => {
        throw new Error("ASR not supported by NVIDIA NIM");
      },
    },
  };
}

// Lazy singleton getter (mimics z-ai-web-dev-sdk's ZAI.create())
export async function getZAI(): Promise<NvidiaLLMClient> {
  if (instance) return instance;
  instance = new NvidiaLLMClient(NVIDIA_CONFIG);
  return instance;
}

export default NvidiaLLMClient;
