"use client";

import { create } from "zustand";
import type { Difficulty } from "@/lib/teacher-config";
import type { HintLanguage } from "@/lib/pricing";

export type Section =
  | "home"
  | "curriculum"
  | "practice"
  | "review"
  | "pronunciation"
  | "roleplay"
  | "translate"
  | "achievements";

export type TTSEngine = "native" | "ai";

interface AppStoreState {
  section: Section;
  language: string;
  level: Difficulty;
  topic: string;
  autoSpeak: boolean;
  voice: string;
  ttsSpeed: number;
  ttsEngine: TTSEngine;
  nativeVoiceURI: string | null;
  hintLanguage: HintLanguage;
  refreshTick: number;

  setSection: (s: Section) => void;
  setLanguage: (l: string) => void;
  setLevel: (l: Difficulty) => void;
  setTopic: (t: string) => void;
  setAutoSpeak: (v: boolean) => void;
  setVoice: (v: string) => void;
  setTtsSpeed: (n: number) => void;
  setTtsEngine: (e: TTSEngine) => void;
  setNativeVoiceURI: (uri: string | null) => void;
  setHintLanguage: (l: HintLanguage) => void;
  triggerRefresh: () => void;
}

export const useAppStore = create<AppStoreState>((set) => ({
  section: "home",
  language: "english",
  level: "beginner",
  topic: "daily-life",
  autoSpeak: true,
  voice: "kazi",
  ttsSpeed: 1.0,
  ttsEngine: "native",
  nativeVoiceURI: null,
  hintLanguage: "English",
  refreshTick: 0,

  setSection: (s) => set({ section: s }),
  setLanguage: (l) => set({ language: l }),
  setLevel: (l) => set({ level: l }),
  setTopic: (t) => set({ topic: t }),
  setAutoSpeak: (v) => set({ autoSpeak: v }),
  setVoice: (v) => set({ voice: v }),
  setTtsSpeed: (n) => set({ ttsSpeed: n }),
  setTtsEngine: (e) => set({ ttsEngine: e }),
  setNativeVoiceURI: (uri) => set({ nativeVoiceURI: uri }),
  setHintLanguage: (l) => set({ hintLanguage: l }),
  triggerRefresh: () => set((s) => ({ refreshTick: s.refreshTick + 1 })),
}));
