import type { Metadata } from "next";
import Link from "next/link";
import { Coins, Gem } from "lucide-react";
import { requireUserId } from "@/server/session";
import { store } from "@/server/store";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/catalog/page-hero";
import { Breadcrumb } from "@/components/catalog/breadcrumb";
import { buttonClass } from "@/components/ui/button-variants";
import { cn, formatCoins } from "@/lib/utils";

export const metadata: Metadata = { title: "Billing & Coins" };

export default async function BillingPage() {
  const userId = await requireUserId("/account/billing");
  const [coins, sub, txns] = await Promise.all([
    store.coins.balance(userId),
    store.subscriptions.activeFor(userId),
    store.coins.recent(userId, 12),
  ]);
  const isPro = sub !== null;

  const REASON_LABEL: Record<string, string> = {
    subscription_grant: "Plan coins",
    generation_video: "Video generation",
    generation_image: "Image generation",
    filter: "Filter",
    tool: "Tool",
    refund: "Refund",
    admin: "Adjustment",
  };

  return (
    <>
      <PageHero
        title="Billing & Coins"
        subtitle="Manage your plan and coin balance."
        top={<Breadcrumb items={[{ href: "/account", label: "Account" }, { label: "Billing" }]} />}
      />
      <Container className="max-w-3xl py-10">
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Plan */}
          <div className="rounded-card border border-hairline bg-surface p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-hi">Plan</h2>
              {isPro && (
                <span className="inline-flex items-center gap-1 rounded-pill bg-grad-gold px-2 py-0.5 text-[11px] font-semibold uppercase text-gold-ink shadow-glow-gold">
                  <Gem className="h-3 w-3" />
                  Pro
                </span>
              )}
            </div>
            {isPro && sub ? (
              <>
                <p className="mt-2 text-sm capitalize text-hi">{sub.plan} plan</p>
                <p className="text-caption text-mid">
                  Renews {sub.currentPeriodEnd.toLocaleDateString("en-IN")}
                </p>
                <p className="mt-4 text-caption text-low">
                  Manage or cancel your subscription anytime.
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-mid">You&rsquo;re on the free plan.</p>
                <Link
                  href="/pricing"
                  className={buttonClass({ variant: "pro", size: "sm", className: "mt-4" })}
                >
                  <Gem className="h-4 w-4" />
                  Go Pro
                </Link>
              </>
            )}
          </div>

          {/* Coins */}
          <div className="rounded-card border border-hairline bg-surface p-6">
            <h2 className="font-display text-lg font-semibold text-hi">Coins</h2>
            <p className="mt-2 inline-flex items-center gap-2 font-mono text-2xl font-semibold text-hi">
              <Coins className="h-6 w-6 text-gold" />
              {formatCoins(coins)}
            </p>
            <p className="mt-1 text-caption text-mid">
              Spend coins on AI generation. Every plan grants coins on renewal.
            </p>
            <Link
              href="/pricing"
              className={buttonClass({ variant: "secondary", size: "sm", className: "mt-4" })}
            >
              Get more coins
            </Link>
          </div>
        </div>

        {/* transactions */}
        <div className="mt-6 rounded-card border border-hairline bg-surface p-6">
          <h2 className="font-display text-lg font-semibold text-hi">Recent activity</h2>
          {txns.length === 0 ? (
            <p className="mt-2 text-caption text-mid">
              Your coin transactions and payments will appear here.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-hairline">
              {txns.map((t, i) => (
                <li key={i} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm text-hi">{REASON_LABEL[t.reason] ?? t.reason}</p>
                    <p className="text-caption text-low">
                      {t.createdAt.toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "font-mono text-sm font-medium tabular",
                      t.delta >= 0 ? "text-cyan" : "text-mid",
                    )}
                  >
                    {t.delta >= 0 ? "+" : ""}
                    {t.delta}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </>
  );
}
