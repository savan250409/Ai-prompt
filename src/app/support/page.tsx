import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/catalog/page-hero";

export const metadata: Metadata = { title: "Support" };

const FAQ = [
  {
    q: "How do I unlock a prompt?",
    a: "Open any prompt and tap Unlock. Pro members unlock instantly with no ads; free members can watch an ad for a limited number of free unlocks each day.",
  },
  {
    q: "What are coins for?",
    a: "Coins are spent on AI generation — images, videos, filters, and tools. Every plan grants coins, and failed generations are refunded automatically.",
  },
  {
    q: "What does Pro include?",
    a: "No ads ever, unlimited prompt unlocks and exclusive content, AI generation, and all aspect ratios unlocked.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Your Pro access continues until the end of the current billing period.",
  },
];

export default function SupportPage() {
  return (
    <>
      <PageHero eyebrow="Help" title="Support" subtitle="Answers to common questions." />
      <Container className="max-w-2xl py-10">
        <div className="space-y-4">
          {FAQ.map((item) => (
            <div key={item.q} className="rounded-card border border-hairline bg-surface p-5">
              <h2 className="font-display text-base font-semibold text-hi">{item.q}</h2>
              <p className="mt-2 text-sm leading-relaxed text-mid">{item.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-card border border-hairline bg-surface-2/60 p-5 text-center">
          <p className="text-sm text-mid">
            Still need help? Email{" "}
            <a href="mailto:support@promptstudio.app" className="font-medium text-cyan">
              support@promptstudio.app
            </a>{" "}
            or send us{" "}
            <Link href="/feedback" className="font-medium text-cyan">
              feedback
            </Link>
            .
          </p>
        </div>
      </Container>
    </>
  );
}
