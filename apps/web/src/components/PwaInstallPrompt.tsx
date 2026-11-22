"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Register Service Worker safely
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => {
          // registered
        })
        .catch(() => {
          // SW registration ignored in dev/unsupported environments
        });
    }

    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleIos = /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIos(isAppleIos);

    // Listen for Android/Chromium install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check if user previously dismissed
      try {
        if (sessionStorage.getItem("waypoint_pwa_dismissed") !== "1") {
          setShowPrompt(true);
        }
      } catch {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIosGuide(false);
    try {
      sessionStorage.setItem("waypoint_pwa_dismissed", "1");
    } catch {}
  };

  if (!showPrompt && !showIosGuide) return null;

  return (
    <div className="border border-[#4db5ff]/60 bg-[#070b12] p-3 text-[#c9d4e4] font-mono text-xs mb-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-none border border-[#4db5ff] bg-[#102030] flex items-center justify-center text-[#4db5ff] shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="text-white font-bold flex items-center gap-2">
              <span>INSTALL WAYPOINT APP</span>
              <span className="text-[9px] px-1 border border-emerald-500/40 text-emerald-400 uppercase">
                PWA STANDALONE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Install to your mobile home screen for quick offline journey tracking and stage milestone updates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={handleInstallClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#102030] hover:bg-[#4db5ff] text-[#4db5ff] hover:text-black border border-[#4db5ff] font-bold text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>INSTALL APP</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-white border border-[#1b2b3a]"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showIosGuide && (
        <div className="mt-3 pt-2.5 border-t border-[#1b2b3a] text-[11px] text-slate-300">
          <span className="text-[#4db5ff] font-bold">iOS Installation:</span> Tap the Share icon{" "}
          <span className="inline-block px-1 border border-[#1b2b3a] bg-[#0c1219]">⎋</span> at the bottom of Safari,
          then select <strong className="text-white">&quot;Add to Home Screen&quot;</strong>.
        </div>
      )}
    </div>
  );
}
