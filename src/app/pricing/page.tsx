import { PLANS, TOPUPS, config } from "@/lib/config";
import { Container } from "@/components/layout/container";
import { BillingTabs } from "@/components/billing/billing-tabs";
import { ProHero } from "@/components/billing/pro-hero";
import { PlanComparison } from "@/components/billing/plan-comparison";
import { ProFaq } from "@/components/billing/pro-faq";
import { Reveal } from "@/components/ui/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Go Pro",
  description: "Unlock unlimited prompts, AI generation and no ads. Weekly, monthly or yearly.",
  path: "/pricing",
});

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
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Prompt Studio Pro",
          description:
            "Unlimited prompt unlocks, AI image & video generation, all aspect ratios, and no ads.",
          brand: { "@type": "Brand", name: "Prompt Studio" },
          offers: plans.map((p) => ({
            "@type": "Offer",
            name: `${p.name} plan`,
            price: p.priceInr,
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
            category: "Subscription",
          })),
        }}
      />
      <ProHero />

      <Container className="space-y-16 py-12 md:space-y-20 md:py-16">
        <BillingTabs plans={plans} topups={topups} />

        <Reveal>
          <PlanComparison />
        </Reveal>

        <Reveal>
          <ProFaq />
        </Reveal>

        {config.devBillingTestMode && (
          <p className="text-center text-caption text-low">
            Dev test-mode: purchases are simulated locally (Razorpay activates when keys are set).
          </p>
        )}
      </Container>
    </>
  );
}
