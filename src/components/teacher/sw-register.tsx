"use client";

import { useEffect } from "react";

// Registers the service worker so the PWA can be installed and the app
// shell is cached for fast startup. Only runs in production / when SW is
// supported. Rendered from the root layout.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Register after window load so it doesn't compete with first paint.
    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then(() => {
          // SW registered - app is now installable.
        })
        .catch(() => {
          // SW registration failed - app still works as a normal website.
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
