"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

const DISMISSED_KEY = "tradeflow-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's own flag; not in the standard Navigator type.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability just degrades to "no custom prompt" -- not worth
        // surfacing to the user.
      });
    }
  }, []);

  useEffect(() => {
    if (isStandaloneDisplay() || localStorage.getItem(DISMISSED_KEY)) return;

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    // Chrome/Android fires beforeinstallprompt; iOS Safari never does, so
    // detect it directly and show the manual "Share -> Add to Home Screen"
    // instructions instead, once, after a beat so it doesn't fight with
    // the page's own entrance animations.
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
    // navigator.userAgent doesn't exist during SSR, so this can only be
    // determined client-side, after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsIOS(ios);
    const timer = ios ? window.setTimeout(() => setVisible(true), 2500) : undefined;

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") setVisible(false);
    else dismiss();
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 340, damping: 32 }}
          className="glass-surface elevation-lg fixed inset-x-4 bottom-4 z-40 flex items-start gap-3 rounded-2xl p-4 sm:inset-x-auto sm:right-4 sm:w-80"
        >
          <div className="flex-1">
            <p className="text-sm font-medium text-primary">Install TradeFlow</p>
            {isIOS ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Tap <Share className="inline h-3 w-3 align-text-bottom" /> Share, then &ldquo;Add to
                Home Screen&rdquo; for one-tap access.
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Add it to your home screen for quicker, full-screen access.
              </p>
            )}
            {!isIOS && (
              <Button size="sm" className="mt-3" onClick={handleInstall}>
                <Download className="h-3.5 w-3.5" />
                Install
              </Button>
            )}
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="shrink-0 rounded-full p-1 text-muted-foreground outline-none transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-accent/40 active:scale-90"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
