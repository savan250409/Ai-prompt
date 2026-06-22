import type { Metadata } from "next";
import { PLANS, config } from "@/lib/config";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/catalog/page-hero";
import { PricingPlans } from "@/components/billing/pricing-plans";

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

  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Go Pro"
        subtitle="Unlimited prompts, AI generation, and no ads. Cancel anytime."
      />
      <Container className="py-12">
        <PricingPlans plans={plans} />
        {config.devBillingTestMode && (
          <p className="mt-8 text-center text-caption text-low">
            Dev test-mode: purchases are simulated locally (Cashfree activates when keys are set).
          </p>
        )}
      </Container>
    </>
  );
}
