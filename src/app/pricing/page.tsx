import type { Metadata } from "next";
import { PLANS, TOPUPS, config } from "@/lib/config";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/catalog/page-hero";
import { PricingPlans } from "@/components/billing/pricing-plans";
import { TopupCards } from "@/components/billing/topup-cards";

export const metadata: Metadata = {
  title: "Go Pro",
  description: "Unlock unlimited prompts, AI generation and no ads. Weekly, monthly or yearly.",
};

export default function PricingPage() {
  const plans = PLANS.map((p) => ({
    id: p.id,
    name: p.name,
    priceInr: p.priceInr,
    coins: p.coins,
    cadence: p.cadence,
    badge: p.badge,
  }));

  const topups = TOPUPS.map((t) => ({
    id: t.id,
    name: t.name,
    priceInr: t.priceInr,
    coins: t.coins,
    badge: t.badge,
  }));

  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Go Pro"
        subtitle="Unlimited prompts, AI generation, and no ads. Cancel anytime."
      />
      <Container className="space-y-14 py-12">
        <PricingPlans plans={plans} />

        <div className="border-t border-hairline pt-12">
          <TopupCards topups={topups} />
        </div>

        {config.devBillingTestMode && (
          <p className="text-center text-caption text-low">
            Dev test-mode: purchases are simulated locally (Cashfree activates when keys are set).
          </p>
        )}
      </Container>
    </>
  );
}
