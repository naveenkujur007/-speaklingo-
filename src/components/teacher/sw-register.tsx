"use client";

import { useEffect, useState } from "react";

// Registers the service worker so the PWA can be installed and the app
// shell is cached for fast startup. Auto-detects new versions and shows a
// toast prompting the user to refresh — never silent, never destructive.
export function ServiceWorkerRegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none", // Always fetch the latest SW
        });

        // Check for updates every 10 minutes while page is open
        setInterval(() => {
          reg.update().catch(() => {});
        }, 10 * 60 * 1000);

        // New waiting worker detected — show update prompt
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                // New version available — prompt user
                setWaitingWorker(newWorker);
                setUpdateAvailable(true);
              }
            }
          });
        });

        // Listen for SW messages (e.g., SW_UPDATED notification)
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data?.type === "SW_UPDATED") {
            // New SW took control — could refresh UI here if needed
            console.log("[SpeakLingo] Updated to version", event.data.version);
          }
        });

        // If a controller already exists, log version
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage("GET_VERSION");
        }
      } catch (e) {
        // SW registration failed - app still works as a normal website.
      }
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  // Force the new SW to activate immediately and refresh all tabs
  const applyUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage("SKIP_WAITING");
    }
    // Wait for the new SW to take control, then reload
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    }, { once: true });
    // Fallback reload after 2 seconds in case controllerchange doesn't fire
    setTimeout(() => window.location.reload(), 2000);
  };

  // Auto-apply update after 5 seconds if user doesn't interact
  useEffect(() => {
    if (updateAvailable) {
      const timer = setTimeout(() => applyUpdate(), 5000);
      return () => clearTimeout(timer);
    }
  }, [updateAvailable]);

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border bg-white p-4 shadow-2xl dark:bg-slate-900 dark:border-slate-700">
      <div className="flex items-start gap-3">
        <div className="text-2xl">🔄</div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            SpeakLingo updated!
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            New version ready. Refreshing in 5s…
          </p>
          <button
            onClick={applyUpdate}
            className="mt-2 rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
          >
            Update now
          </button>
        </div>
      </div>
    </div>
  );
}
