"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

// Captures the beforeinstallprompt event so we can show our own
// "Install App" button instead of the browser's default mini-infobar.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt: () => Promise<void>;
}

const DISMISS_KEY = "linguabot-install-dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Already installed (running standalone) - don't show prompt.
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;
    if (isStandalone) {
      queueMicrotask(() => setInstalled(true));
      return;
    }

    // Check if user previously dismissed the banner recently.
    try {
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || "0");
      if (dismissedAt && Date.now() - dismissedAt < DISMISS_DURATION) {
        return;
      }
    } catch {
      // ignore localStorage errors
    }

    const handler = (e: Event) => {
      // Prevent the default browser mini-infobar.
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    const installedHandler = () => {
      setInstalled(true);
      setShowBanner(false);
      setShowModal(false);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // No native prompt available - show manual instructions modal.
      setShowModal(true);
      return;
    }
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  };

  // Native install banner (Chrome/Edge/Android)
  if (showBanner && !installed) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md animate-in slide-in-from-bottom-4 duration-300">
        <div className="rounded-xl bg-white shadow-2xl border border-emerald-200 p-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white shrink-0">
            <Download className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-stone-800">
              Install SpeakLingo
            </p>
            <p className="text-[11px] text-stone-500 truncate">
              Add to home screen · works offline-style
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleInstall}
            className="bg-emerald-500 hover:bg-emerald-600 text-white shrink-0"
          >
            Install
          </Button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="text-stone-400 hover:text-stone-600 shrink-0 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Floating install button (always visible on non-installed, non-dismissed)
  // so the user can install anytime, not just when the banner shows.
  if (!installed && !showBanner) {
    return (
      <>
        <button
          type="button"
          onClick={handleInstall}
          aria-label="Install SpeakLingo app"
          className={cn(
            "fixed bottom-4 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full",
            "bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 transition-all",
            "shadow-emerald-300/50 hover:scale-105 active:scale-95",
            "border-2 border-white"
          )}
          title="Install SpeakLingo"
        >
          <Download className="h-5 w-5" />
        </button>

        {showModal && (
          <ManualInstallModal
            onClose={() => setShowModal(false)}
            onInstall={handleInstall}
            hasNativePrompt={!!deferredPrompt}
          />
        )}
      </>
    );
  }

  // Manual install instructions modal (for iOS Safari which doesn't
  // support beforeinstallprompt)
  if (showModal && !installed) {
    return (
      <ManualInstallModal
        onClose={() => setShowModal(false)}
        onInstall={handleInstall}
        hasNativePrompt={!!deferredPrompt}
      />
    );
  }

  return null;
}

function ManualInstallModal({
  onClose,
  onInstall,
  hasNativePrompt,
}: {
  onClose: () => void;
  onInstall: () => void;
  hasNativePrompt: boolean;
}) {
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">(
    "desktop"
  );

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    let p: "ios" | "android" | "desktop" = "desktop";
    if (/iphone|ipad|ipod/.test(ua)) p = "ios";
    else if (/android/.test(ua)) p = "android";
    queueMicrotask(() => setPlatform(p));
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Download className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-800">
                Install SpeakLingo
              </h2>
              <p className="text-xs text-stone-500">
                Open it anytime from your home screen
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-stone-400 hover:text-stone-600 p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Platform tabs */}
        <div className="flex gap-1 bg-stone-100 p-1 rounded-lg">
          <PlatformTab
            active={platform === "desktop"}
            onClick={() => setPlatform("desktop")}
            icon={<Monitor className="h-3.5 w-3.5" />}
            label="Laptop"
          />
          <PlatformTab
            active={platform === "android"}
            onClick={() => setPlatform("android")}
            icon={<Smartphone className="h-3.5 w-3.5" />}
            label="Android"
          />
          <PlatformTab
            active={platform === "ios"}
            onClick={() => setPlatform("ios")}
            icon={<Smartphone className="h-3.5 w-3.5" />}
            label="iPhone"
          />
        </div>

        {/* Instructions per platform */}
        <div className="text-sm text-stone-700 space-y-2 min-h-[120px]">
          {platform === "desktop" && (
            <ol className="list-decimal list-inside space-y-1.5 text-xs">
              <li>
                Look for the <strong>install icon</strong> (⊕ or ↓) in your
                browser&apos;s address bar (Chrome / Edge).
              </li>
              <li>
                Click it and choose <strong>Install</strong>.
              </li>
              <li>
                SpeakLingo will open in its own window and show up on your desktop
                / taskbar.
              </li>
              <li className="text-stone-500 pt-1">
                Or use the button below to install now.
              </li>
            </ol>
          )}
          {platform === "android" && (
            <ol className="list-decimal list-inside space-y-1.5 text-xs">
              <li>
                Tap the <strong>three-dot menu</strong> (⋮) in Chrome / Edge.
              </li>
              <li>
                Choose <strong>Install app</strong> or{" "}
                <strong>Add to Home screen</strong>.
              </li>
              <li>
                Confirm — SpeakLingo will appear as an app icon on your phone.
              </li>
              <li className="text-stone-500 pt-1">
                Or tap the button below if your browser supports it.
              </li>
            </ol>
          )}
          {platform === "ios" && (
            <ol className="list-decimal list-inside space-y-1.5 text-xs">
              <li>
                Tap the <strong>Share button</strong> (square with up arrow) at
                the bottom of Safari.
              </li>
              <li>
                Scroll and tap <strong>Add to Home Screen</strong>.
              </li>
              <li>
                Tap <strong>Add</strong> — SpeakLingo will appear as an app icon.
              </li>
              <li className="text-stone-500 pt-1">
                iOS Safari doesn&apos;t support a one-tap install button.
              </li>
            </ol>
          )}
        </div>

        {hasNativePrompt && (
          <Button
            onClick={onInstall}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Download className="h-4 w-4 mr-1" />
            Install Now
          </Button>
        )}
      </div>
    </div>
  );
}

function PlatformTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors",
        active
          ? "bg-white text-emerald-700 shadow-sm"
          : "text-stone-500 hover:text-stone-700"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
