"use client";

import { useCallback, useEffect, useState } from "react";

export interface BrowserVoice {
  uri: string;
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
}

export function useBrowserVoices() {
  const [voices, setVoices] = useState<BrowserVoice[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => {
      const list = window.speechSynthesis.getVoices();
      if (list && list.length > 0) {
        setVoices(list.map((v) => ({
          uri: v.voiceURI, name: v.name, lang: v.lang,
          localService: v.localService, default: v.default,
        })));
        setLoaded(true);
      }
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  return { voices, loaded };
}

export async function speakNative(
  text: string, voiceURI?: string, rate = 1.0, pitch = 1.0
): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = rate; utter.pitch = pitch; utter.volume = 1;
  if (voiceURI) {
    const all = window.speechSynthesis.getVoices();
    const match = all.find((v) => v.voiceURI === voiceURI);
    if (match) { utter.voice = match; utter.lang = match.lang; }
  }
  return new Promise<void>((resolve) => {
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    setTimeout(() => { window.speechSynthesis.speak(utter); }, 50);
  });
}

export function cancelNativeSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
