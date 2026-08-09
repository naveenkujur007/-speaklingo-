"use client";

import { create } from "zustand";
import type { Difficulty } from "@/lib/teacher-config";

export type Section =
  | "home"
  | "curriculum"
  | "practice"
  | "review"
  | "pronunciation"
  | "roleplay"
  | "translate"
  | "achievements";

interface AppStoreState {
  section: Section;
  language: string;
  level: Difficulty;
  topic: string;
  autoSpeak: boolean;
  voice: string;
  ttsSpeed: number;
  // Bump this number to trigger re-fetches of stats/progress/achievements.
  refreshTick: number;

  setSection: (s: Section) => void;
  setLanguage: (l: string) => void;
  setLevel: (l: Difficulty) => void;
  setTopic: (t: string) => void;
  setAutoSpeak: (v: boolean) => void;
  setVoice: (v: string) => void;
  setTtsSpeed: (n: number) => void;
  triggerRefresh: () => void;
}

export const useAppStore = create<AppStoreState>((set) => ({
  section: "home",
  language: "english",
  level: "beginner",
  topic: "daily-life",
  autoSpeak: true,
  voice: "chuichui",
  ttsSpeed: 1.15,
  refreshTick: 0,

  setSection: (s) => set({ section: s }),
  setLanguage: (l) => set({ language: l }),
  setLevel: (l) => set({ level: l }),
  setTopic: (t) => set({ topic: t }),
  setAutoSpeak: (v) => set({ autoSpeak: v }),
  setVoice: (v) => set({ voice: v }),
  setTtsSpeed: (n) => set({ ttsSpeed: n }),
  triggerRefresh: () => set((s) => ({ refreshTick: s.refreshTick + 1 })),
}));
