"use client";

import { create } from "zustand";
import type { CorrectionItem, Difficulty } from "@/lib/teacher-config";

export interface ChatMessageVM {
  id: string; // local id for keying
  role: "user" | "assistant";
  content: string;
  corrections?: CorrectionItem[];
  createdAt: number;
  isLoading?: boolean;
  error?: string;
}

interface ChatStoreState {
  messages: ChatMessageVM[];
  sessionId: string | null;
  language: string;
  level: Difficulty;
  topic: string;
  isSending: boolean;
  isTranscribing: boolean;
  autoSpeak: boolean;

  setLanguage: (l: string) => void;
  setLevel: (l: Difficulty) => void;
  setTopic: (t: string) => void;
  setSessionId: (id: string | null) => void;
  setAutoSpeak: (v: boolean) => void;
  setIsSending: (v: boolean) => void;
  setIsTranscribing: (v: boolean) => void;

  pushUserMessage: (content: string) => string;
  pushAssistantPlaceholder: () => string;
  finalizeAssistant: (id: string, content: string, corrections: CorrectionItem[]) => void;
  markError: (id: string, error: string) => void;
  reset: () => void;
}

let idCounter = 0;
const nextId = () => `m_${Date.now()}_${idCounter++}`;

export const useChatStore = create<ChatStoreState>((set) => ({
  messages: [],
  sessionId: null,
  language: "english",
  level: "beginner",
  topic: "daily-life",
  isSending: false,
  isTranscribing: false,
  autoSpeak: true,

  setLanguage: (l) => set({ language: l }),
  setLevel: (l) => set({ level: l }),
  setTopic: (t) => set({ topic: t }),
  setSessionId: (id) => set({ sessionId: id }),
  setAutoSpeak: (v) => set({ autoSpeak: v }),
  setIsSending: (v) => set({ isSending: v }),
  setIsTranscribing: (v) => set({ isTranscribing: v }),

  pushUserMessage: (content) => {
    const id = nextId();
    set((s) => ({
      messages: [
        ...s.messages,
        { id, role: "user", content, createdAt: Date.now() },
      ],
    }));
    return id;
  },

  pushAssistantPlaceholder: () => {
    const id = nextId();
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id,
          role: "assistant",
          content: "",
          createdAt: Date.now(),
          isLoading: true,
        },
      ],
    }));
    return id;
  },

  finalizeAssistant: (id, content, corrections) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id
          ? { ...m, content, corrections, isLoading: false }
          : m
      ),
    })),

  markError: (id, error) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, error, isLoading: false } : m
      ),
    })),

  reset: () =>
    set({
      messages: [],
      sessionId: null,
      isSending: false,
      isTranscribing: false,
    }),
}));
