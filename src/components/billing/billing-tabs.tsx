"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Coins, Gem } from "lucide-react";
import { PricingPlans, type PlanView } from "./pricing-plans";
import { TopupCards, type TopupView } from "./topup-cards";
import { cn } from "@/lib/utils";

type TabId = "plans" | "topup";

const TABS = [
  { id: "plans" as const, label: "Pro Plans", icon: Gem },
  { id: "topup" as const, label: "Top up coins", icon: Coins },
];

/**
 * Go Pro screen — subscription plans and one-time coin top-ups shown
 * side-by-side as tabs instead of stacked sections.
 */
export function BillingTabs({ plans, topups }: { plans: PlanView[]; topups: TopupView[] }) {
  const [tab, setTab] = useState<TabId>("plans");

  return (
    <div className="space-y-10">
      <div className="flex justify-center">
        <div
          role="tablist"
          aria-label="Billing options"
          className="inline-flex gap-1 rounded-pill border border-hairline bg-surface-2 p-1"
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-selected={active}
                aria-controls={`panel-${id}`}
                onClick={() => setTab(id)}
                className={cn(
                  "relative inline-flex items-center gap-1.5 rounded-pill px-5 py-2 text-sm font-medium transition-colors duration-base",
                  active ? "text-on-electric" : "text-mid hover:text-hi",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="billing-tab"
                    className="absolute inset-0 rounded-pill bg-grad-electric shadow-glow"
                    transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  />
                )}
                <span className="relative inline-flex items-center gap-1.5">
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Each panel needs its own <h2> so the plan/top-up card <h3>s don't skip
          a level under the page <h1> (Lighthouse `heading-order`). */}
      {tab === "plans" ? (
        <div role="tabpanel" id="panel-plans" aria-labelledby="tab-plans">
          <h2 className="sr-only">Pro plans</h2>
          <PricingPlans plans={plans} />
        </div>
      ) : (
        <div role="tabpanel" id="panel-topup" aria-labelledby="tab-topup">
          <h2 className="sr-only">Top up coins</h2>
          <TopupCards topups={topups} showHeading={false} />
        </div>
      )}
    </div>
  );
}
