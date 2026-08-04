"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coins, Gem, Play, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

/**
 * Free-user choice before generating with an AI tool: watch a (simulated) ad to
 * generate for free, or spend coins to skip it. Pro users never see this — they
 * pay coins directly. Mirrors the unlock dialog's reward animation (§9).
 */
export function ToolPayDialog({
  open,
  onClose,
  toolName,
  coinCost,
  coins,
  onWatchAd,
  onUseCoins,
}: {
  open: boolean;
  onClose: () => void;
  toolName: string;
  coinCost: number;
  coins: number;
  onWatchAd: () => void;
  onUseCoins: () => void;
}) {
  const [watching, setWatching] = useState(false);
  const [progress, setProgress] = useState(0);
  const notEnough = coins < coinCost;

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

  return (
    <Modal
      open={open}
      onClose={watching ? () => {} : onClose}
      title={watching ? undefined : `Generate with ${toolName}`}
      dismissable={!watching}
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
            Watch a short ad to generate for free, or use coins to skip it.
          </p>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => setWatching(true)}
          >
            <Play className="h-4 w-4" />
            Watch ad — generate free
          </Button>

          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={onUseCoins}
            disabled={notEnough}
          >
            <Coins className="h-4 w-4 text-gold" />
            Use {coinCost} coins
          </Button>
          {notEnough && (
            <p className="text-center text-caption text-mid">
              Not enough coins.{" "}
              <Link href="/pricing" className="text-cyan hover:underline">
                Get more
              </Link>
            </p>
          )}

          <Link
            href="/pricing"
            className="flex items-center justify-center gap-1.5 text-caption font-medium text-gold hover:underline"
          >
            <Gem className="h-3.5 w-3.5" />
            Go Pro — no ads, unlimited
          </Link>
        </div>
      )}
    </Modal>
  );
}
