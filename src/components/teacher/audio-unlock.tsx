"use client";

import { useEffect, useRef } from "react";

export function AudioUnlock() {
  const unlockedRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const unlock = () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;
      try {
        if ("speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance("");
          u.volume = 0;
          window.speechSynthesis.speak(u);
        }
      } catch {}
      try {
        const audio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=");
        audio.volume = 0;
        audio.play().then(() => { audio.pause(); }).catch(() => {});
      } catch {}
      window.removeEventListener("click", unlock, true);
      window.removeEventListener("touchend", unlock, true);
      window.removeEventListener("keydown", unlock, true);
    };
    window.addEventListener("click", unlock, true);
    window.addEventListener("touchend", unlock, true);
    window.addEventListener("keydown", unlock, true);
    return () => {
      window.removeEventListener("click", unlock, true);
      window.removeEventListener("touchend", unlock, true);
      window.removeEventListener("keydown", unlock, true);
    };
  }, []);
  return null;
}
