"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowUpRight, Check, Gem } from "lucide-react";
import type { PlanId } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { openRazorpayCheckout } from "./razorpay";
import { planState } from "./plan-state";
import { useSession } from "@/store/session";
import { track } from "@/lib/analytics";
import { cn, formatInr } from "@/lib/utils";

export interface PlanView {
  id: PlanId;
  name: string;
  priceInr: number;
  coins: number;
  cadence: string;
  badge: string | null;
}

/** How many billing periods make a year — used to compare plans fairly. */
const PERIODS_PER_YEAR: Record<string, number> = { week: 52, month: 12, year: 1 };

const annualCost = (p: PlanView) => p.priceInr * (PERIODS_PER_YEAR[p.cadence] ?? 1);

export function PricingPlans({ plans }: { plans: PlanView[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useSession((s) => s.me);
  const [busy, setBusy] = useState<PlanId | null>(null);

  // The billing toggle simply spotlights a card; every plan stays visible.
  const popularId = plans.find((p) => p.badge === "MOST POPULAR")?.id ?? plans[0]?.id;
  const [selected, setSelected] = useState<PlanId>(popularId);

  // Savings vs. the priciest cadence, annualised (e.g. yearly vs weekly×52).
  const baseline = plans.reduce((max, p) => Math.max(max, annualCost(p)), 0);
  const savingsPct = (p: PlanView): number | null => {
    if (!baseline) return null;
    const pct = Math.round((1 - annualCost(p) / baseline) * 100);
    return pct > 0 ? pct : null;
  };
  const bestSaving = plans.reduce((max, p) => Math.max(max, savingsPct(p) ?? 0), 0);

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
      {/* billing toggle */}
      <div className="flex flex-col items-center gap-2">
        <Segmented<PlanId>
          name="billing-cadence"
          options={plans.map((p) => ({ value: p.id, label: p.name }))}
          value={selected}
          onChange={setSelected}
        />
        {bestSaving > 0 && (
          <p className="text-caption text-mid">
            Save up to <span className="font-semibold text-gold">{bestSaving}%</span> with a longer
            plan
          </p>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {plans.map((plan) => {
          const { owned, active, spotlight, ctaLabel, ctaDisabled } = planState(me, plan, selected);
          const saving = savingsPct(plan);

          return (
            <div
              key={plan.id}
              aria-current={owned ? "true" : undefined}
              className={cn(
                "relative flex flex-col rounded-modal border bg-surface p-6 shadow-card transition-all duration-base ease-out-expo",
                owned
                  ? "border-hairline opacity-80" // your plan → calm, never highlighted
                  : spotlight
                    ? "border-cyan/40 shadow-glow md:-translate-y-2"
                    : "border-hairline hover:-translate-y-1",
              )}
            >
              {/* badge — hidden on your own plan so it isn't highlighted */}
              {!owned && plan.badge && (
                <span
                  className={cn(
                    "absolute -top-3 left-6 rounded-pill px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide shadow-card",
                    plan.badge === "BEST VALUE"
                      ? "bg-grad-gold text-gold-ink shadow-glow-gold"
                      : "bg-grad-electric text-on-electric",
                  )}
                >
                  {plan.badge}
                </span>
              )}

              {owned && (
                <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-pill border border-hairline bg-surface-2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-mid">
                  <Check className="h-3 w-3" strokeWidth={3} />
                  {active ? "Your plan" : "Cancelled"}
                </span>
              )}

              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-lg font-semibold text-hi">{plan.name}</h3>
                {!owned && saving && (
                  <span className="rounded-pill border border-hairline px-2 py-0.5 font-mono text-[11px] text-gold">
                    save {saving}%
                  </span>
                )}
              </div>

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
                {ctaDisabled ? (
                  <Button variant="secondary" className="w-full" disabled>
                    {ctaLabel}
                  </Button>
                ) : (
                  <Button
                    variant={spotlight ? "pro" : "primary"}
                    className="w-full"
                    onClick={() => choose(plan.id)}
                    loading={busy === plan.id}
                  >
                    {busy === plan.id ? null : ctaLabel === "Upgrade" ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : spotlight ? (
                      <Gem className="h-4 w-4" />
                    ) : null}
                    {ctaLabel}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
