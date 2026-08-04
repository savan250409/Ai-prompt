"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Gem } from "lucide-react";
import type { PlanId } from "@/lib/config";
import type { Me } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { openRazorpayCheckout } from "./razorpay";
import { useSession } from "@/store/session";
import { track } from "@/lib/analytics";
import { cn, formatInr } from "@/lib/utils";

/** This is the user's plan and it's still renewing → lock the button. */
function isCurrentActive(me: Me | null, planId: PlanId): boolean {
  return me?.plan === planId && me?.planStatus === "active";
}
/** This is the user's plan but cancelled → offer to resume it. */
function isCurrentCancelled(me: Me | null, planId: PlanId): boolean {
  return me?.plan === planId && me?.planStatus === "cancelled";
}

interface PlanView {
  id: PlanId;
  name: string;
  priceInr: number;
  coins: number;
  cadence: string;
  badge: string | null;
}

const BENEFITS = [
  "No ads, ever",
  "Infinite photo & video prompts + exclusive content",
  "AI image & video generation",
  "Unlock all aspect ratios",
];

export function PricingPlans({ plans }: { plans: PlanView[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useSession((s) => s.me);
  const [busy, setBusy] = useState<PlanId | null>(null);

  async function choose(plan: PlanId) {
    if (!me?.authenticated) {
      toast.info("Sign in to go Pro.");
      router.push("/login?next=/pricing");
      return;
    }
    setBusy(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Checkout failed.");
        return;
      }

      if (data.mode === "test") {
        track("subscribe", { plan, mode: "test" });
        await queryClient.invalidateQueries({ queryKey: ["me"] });
        toast.success(`You're Pro! ${data.coins} coins added.`);
        router.push("/account/billing");
        router.refresh();
      } else if (data.mode === "razorpay" || data.mode === "razorpay_subscription") {
        track("subscribe", { plan, mode: data.mode });
        const paid = await openRazorpayCheckout(data);
        if (!paid) return; // cancelled or verification failed
        await queryClient.invalidateQueries({ queryKey: ["me"] });
        toast.success("You're Pro! 🎉");
        router.push("/account/billing");
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-5 md:grid-cols-3">
        {plans.map((plan) => {
          const popular = plan.badge === "MOST POPULAR";
          const best = plan.badge === "BEST VALUE";
          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-modal border bg-surface p-6 shadow-card transition-transform duration-base",
                popular ? "border-cyan/40 shadow-glow md:-translate-y-2" : "border-hairline",
                best && "ring-gold",
              )}
            >
              {plan.badge && (
                <span
                  className={cn(
                    "absolute -top-3 left-6 rounded-pill px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide shadow-card",
                    best
                      ? "bg-grad-gold text-gold-ink shadow-glow-gold"
                      : "bg-grad-electric text-on-electric",
                  )}
                >
                  {plan.badge}
                </span>
              )}

              <h3 className="font-display text-lg font-semibold text-hi">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-display text-3xl font-semibold text-hi">
                  {formatInr(plan.priceInr)}
                </span>
                <span className="text-caption text-mid">/ {plan.cadence}</span>
              </div>
              <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-sm text-gold">
                <Gem className="h-3.5 w-3.5" />
                {plan.coins} coins included
              </p>

              <div className="mt-6">
                {isCurrentActive(me, plan.id) ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Current plan active
                  </Button>
                ) : (
                  <Button
                    variant={best ? "pro" : "primary"}
                    className="w-full"
                    onClick={() => choose(plan.id)}
                    loading={busy === plan.id}
                  >
                    {busy === plan.id ? null : best ? <Gem className="h-4 w-4" /> : null}
                    {isCurrentCancelled(me, plan.id) ? "Resume plan" : `Choose ${plan.name}`}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* shared benefits */}
      <div className="rounded-modal border border-hairline bg-surface p-6">
        <h3 className="font-display text-base font-semibold text-hi">Every plan includes</h3>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2.5">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-grad-gold text-gold-ink">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              <span className="text-sm text-hi">{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
