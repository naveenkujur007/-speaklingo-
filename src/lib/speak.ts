"use client";

import { useAppStore } from "@/hooks/use-app-store";
import { cancelNativeSpeech } from "@/hooks/use-native-tts";

let nativeAvailableCache: boolean | null = null;

function isNativeSpeechAvailable(): boolean {
  if (nativeAvailableCache !== null) return nativeAvailableCache;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    nativeAvailableCache = false;
    return false;
  }
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) { nativeAvailableCache = true; return true; }
  nativeAvailableCache = true;
  return true;
}

export function markNativeSpeechBroken() { nativeAvailableCache = false; }

// Play via Google Translate TTS proxy — professional adult English voice.
// Free, no API key, sounds natural.
async function playViaGoogleTTS(text: string): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/tts-proxy?text=${encodeURIComponent(text.slice(0, 200))}&lang=en`
    );
    if (!res.ok) return false;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    await audio.play();
    audio.onended = () => URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

// Play via cloud AI TTS (z-ai-web-dev-sdk) — fallback.
async function playViaAI(text: string, aiVoice?: string, speed?: number): Promise<boolean> {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice: aiVoice, speed }),
    });
    if (!res.ok) return false;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    await audio.play();
    audio.onended = () => URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

// Play via native browser speechSynthesis.
async function playViaNative(text: string, voiceURI?: string | null, rate?: number): Promise<boolean> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const utter = new SpeechSynthesisUtterance(text);
    if (rate) utter.rate = rate;
    utter.volume = 1; utter.pitch = 1;

    if (voiceURI) {
      const all = window.speechSynthesis.getVoices();
      const match = all.find((v) => v.voiceURI === voiceURI);
      if (match) { utter.voice = match; utter.lang = match.lang; }
    }

    utter.onstart = () => { settled = true; };
    utter.onend = () => { if (!settled) settled = true; resolve(true); };
    utter.onerror = (e) => {
      if (!settled) {
        settled = true;
        const err = (e as SpeechSynthesisErrorEvent).error || "";
        resolve(err !== "canceled" && err !== "interrupted" ? false : true);
      }
    };

    setTimeout(() => { try { window.speechSynthesis.speak(utter); } catch { resolve(false); } }, 50);
    setTimeout(() => {
      if (!settled) { settled = true; try { window.speechSynthesis.cancel(); } catch {} resolve(false); }
    }, 3000);
  });
}

// Centralized speak function.
// Priority: Native browser → Google TTS proxy → Cloud AI
export async function speakText(
  text: string,
  opts?: { engine?: "native" | "ai"; aiVoice?: string; nativeVoiceURI?: string | null; speed?: number }
): Promise<void> {
  const state = useAppStore.getState();
  const engine = opts?.engine ?? state.ttsEngine;
  const speed = opts?.speed ?? state.ttsSpeed;

  if (!text || !text.trim()) return;

  // 1. Try native browser voices (Google US English, Microsoft Zira, etc.)
  if (engine === "native" && isNativeSpeechAvailable()) {
    const voiceURI = opts?.nativeVoiceURI ?? state.nativeVoiceURI;
    const ok = await playViaNative(text, voiceURI, speed);
    if (ok) return;
    markNativeSpeechBroken();
  }

  // 2. Try Google Translate TTS proxy — professional adult voice, free
  const googleOk = await playViaGoogleTTS(text);
  if (googleOk) return;

  // 3. Fallback to cloud AI TTS
  const aiVoice = opts?.aiVoice ?? state.voice;
  await playViaAI(text, aiVoice, speed);
}

export function stopSpeaking() { cancelNativeSpeech(); }
