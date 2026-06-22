"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Gem } from "lucide-react";
import type { PlanId } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useSession, selectIsPro } from "@/store/session";
import { track } from "@/lib/analytics";
import { cn, formatInr } from "@/lib/utils";

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

declare global {
  interface Window {
    Cashfree?: (opts: { mode: "sandbox" | "production" }) => {
      checkout: (o: Record<string, unknown>) => Promise<{ error?: unknown; redirect?: boolean }>;
    };
  }
}

export function PricingPlans({ plans }: { plans: PlanView[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useSession((s) => s.me);
  const isPro = useSession(selectIsPro);
  const setPhone = useSession((s) => s.setPhone);
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [needPhonePlan, setNeedPhonePlan] = useState<PlanId | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

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
      } else if (data.mode === "need_phone") {
        setNeedPhonePlan(plan);
      } else if (data.mode === "cashfree") {
        track("subscribe", { plan, mode: "cashfree" });
        await openCashfree(data, queryClient, router);
      }
    } finally {
      setBusy(null);
    }
  }

  // Cashfree needs a phone; collect it once, then retry checkout.
  async function savePhoneAndContinue() {
    const plan = needPhonePlan;
    if (!plan) return;
    setSavingPhone(true);
    try {
      const res = await fetch("/api/me/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Enter a valid mobile number.");
        return;
      }
      setPhone(data.phone ?? null);
      setNeedPhonePlan(null);
      setPhoneInput("");
      await choose(plan);
    } finally {
      setSavingPhone(false);
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
                {isPro ? (
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
                    Choose {plan.name}
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

      <Modal
        open={needPhonePlan !== null}
        onClose={() => setNeedPhonePlan(null)}
        title="Add your mobile number"
      >
        <p className="text-caption text-mid">
          Cashfree needs a mobile number to process your payment.
        </p>
        <div className="mt-4 flex items-center overflow-hidden rounded-input border border-hairline bg-surface-2 focus-within:border-cyan">
          <span className="px-3 font-mono text-sm text-mid">+91</span>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="98765 43210"
            className="min-w-0 flex-1 bg-transparent py-2.5 pr-3 font-mono text-sm text-hi placeholder:text-low focus:outline-none"
          />
        </div>
        <Button className="mt-4 w-full" onClick={savePhoneAndContinue} loading={savingPhone}>
          Continue to payment
        </Button>
      </Modal>
    </div>
  );
}

async function openCashfree(
  data: { paymentSessionId: string; env: "sandbox" | "production" },
  queryClient: ReturnType<typeof useQueryClient>,
  router: ReturnType<typeof useRouter>,
) {
  await loadCashfreeScript();
  if (!window.Cashfree) {
    toast.error("Could not load the payment window.");
    return;
  }
  const cashfree = window.Cashfree({ mode: data.env });
  const result = await cashfree.checkout({
    paymentSessionId: data.paymentSessionId,
    redirectTarget: "_modal",
  });
  // User closed the modal or the payment failed — nothing to activate.
  if (result?.error) return;

  // Activation is authoritative via the webhook; poll status, then refresh.
  toast.success("Payment received — activating Pro…");
  for (let i = 0; i < 20; i++) {
    const s = await fetch("/api/billing/status").then((r) => r.json());
    if (s.isPro) break;
    await new Promise((r) => setTimeout(r, 1000));
  }
  await queryClient.invalidateQueries({ queryKey: ["me"] });
  router.push("/account/billing");
  router.refresh();
}

function loadCashfreeScript(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || window.Cashfree) return resolve();
    const existing = document.querySelector('script[src*="sdk.cashfree.com"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });
}
