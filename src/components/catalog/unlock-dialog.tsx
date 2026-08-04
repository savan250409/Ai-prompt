"use client";

import { useEffect, useState } from "react";
import { Gem, Loader2, Play, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

/**
 * Unlock dialog — Buy Pro / Watch Ad (§6, §7). The "ad" is a simulated reward
 * (web rewarded-video SDKs are limited); the server enforces the free quota.
 */
export function UnlockDialog({
  open,
  onClose,
  freeRemaining,
  unlocking,
  onBuyPro,
  onWatchAd,
}: {
  open: boolean;
  onClose: () => void;
  freeRemaining: number;
  unlocking: boolean;
  onBuyPro: () => void;
  onWatchAd: () => void;
}) {
  const [watching, setWatching] = useState(false);
  const [progress, setProgress] = useState(0);
  const noFree = freeRemaining <= 0;

  useEffect(() => {
    if (!watching) return;
    setProgress(0);
    const start = performance.now();
    const dur = 2600;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setWatching(false);
        onWatchAd();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [watching, onWatchAd]);

  const busy = watching || unlocking;

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title={watching ? undefined : "Unlock this prompt"}
      dismissable={!busy}
    >
      {watching ? (
        <div className="space-y-5 py-2 text-center">
          <div className="relative mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-modal bg-grad-electric text-on-electric shadow-glow">
            <Sparkles className="h-9 w-9" />
            <span className="absolute inset-0 animate-pulse bg-white/10" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-hi">Your reward is on the way…</p>
            <p className="text-caption text-mid">Hang tight for a moment.</p>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-grad-electric transition-[width] duration-100"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-mid">
            Unlock without ads by upgrading to Pro, or watch an ad to continue for free.
          </p>

          <Button variant="pro" size="lg" className="w-full" onClick={onBuyPro} disabled={unlocking}>
            <Gem className="h-4 w-4" />
            Buy Pro — no ads, unlimited
          </Button>

          {noFree ? (
            <p className="rounded-input border border-hairline bg-surface-2 p-3 text-caption text-mid">
              You&rsquo;ve used your free unlocks for today. Go Pro for unlimited unlocks.
            </p>
          ) : (
            <>
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={() => setWatching(true)}
                disabled={unlocking}
              >
                {unlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Watch ad to unlock
              </Button>
              <p className="text-center text-caption text-low">
                {freeRemaining} free unlock{freeRemaining === 1 ? "" : "s"} left today
              </p>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
