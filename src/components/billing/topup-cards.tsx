"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Coins } from "lucide-react";
import type { TopupId } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { openRazorpayCheckout } from "./razorpay";
import { useSession } from "@/store/session";
import { track } from "@/lib/analytics";
import { cn, formatInr } from "@/lib/utils";

interface TopupView {
  id: TopupId;
  name: string;
  priceInr: number;
  coins: number;
  badge: string | null;
}

/** One-time coin top-ups (no subscription). Mirrors the checkout flow. */
export function TopupCards({ topups }: { topups: TopupView[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useSession((s) => s.me);
  const [busy, setBusy] = useState<TopupId | null>(null);

  async function buy(topup: TopupId) {
    if (!me?.authenticated) {
      toast.info("Sign in to buy coins.");
      router.push("/login?next=/pricing");
      return;
    }
    setBusy(topup);
    try {
      const res = await fetch("/api/billing/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topup }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Purchase failed.");
        return;
      }

      if (data.mode === "test") {
        track("topup", { topup, mode: "test" });
        await queryClient.invalidateQueries({ queryKey: ["me"] });
        toast.success(`${data.coins} coins added!`);
        router.refresh();
      } else if (data.mode === "razorpay") {
        track("topup", { topup, mode: "razorpay" });
        const paid = await openRazorpayCheckout(data);
        if (!paid) return; // cancelled or verification failed
        await queryClient.invalidateQueries({ queryKey: ["me"] });
        toast.success("Coins added! 🎉");
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-display text-xl font-semibold text-hi">Top up coins</h2>
        <p className="text-caption text-mid">
          One-time purchase — coins are added instantly, no subscription.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {topups.map((t) => {
          const best = t.badge === "BEST VALUE";
          return (
            <div
              key={t.id}
              className={cn(
                "relative flex flex-col rounded-modal border bg-surface p-6 shadow-card transition-transform duration-base",
                best ? "ring-gold" : "border-hairline",
              )}
            >
              {t.badge && (
                <span className="absolute -top-3 left-6 rounded-pill bg-grad-gold px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gold-ink shadow-glow-gold">
                  {t.badge}
                </span>
              )}

              <h3 className="font-display text-lg font-semibold text-hi">{t.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-3xl font-semibold text-hi">
                  {formatInr(t.priceInr)}
                </span>
              </div>
              <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-sm text-gold">
                <Coins className="h-3.5 w-3.5" />
                {t.coins} coins
              </p>

              <div className="mt-6">
                <Button
                  variant={best ? "pro" : "secondary"}
                  className="w-full"
                  onClick={() => buy(t.id)}
                  loading={busy === t.id}
                >
                  {busy === t.id ? null : <Coins className="h-4 w-4" />}
                  Buy {t.coins} coins
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
