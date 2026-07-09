import { ChevronDown } from "lucide-react";
import { config } from "@/lib/config";

/** Answers mirror /support — kept factual to how billing actually behaves. */
const FAQ = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancelling stops the renewal — you keep Pro and any remaining benefits until the end of the period you already paid for.",
  },
  {
    q: "What are coins for?",
    a: "Coins are spent on AI generation — images, videos, filters, and tools. Every plan grants coins, and if a generation fails your coins are refunded automatically.",
  },
  {
    q: "What does Pro include?",
    a: "No ads ever, unlimited prompt unlocks, exclusive collections, AI image & video generation, and every aspect ratio unlocked.",
  },
  {
    q: "Do I need a plan to generate?",
    a: "No — you can buy a one-time coin top-up instead. Top-ups never expire into a subscription; they simply add coins to your balance.",
  },
  {
    q: "How do free unlocks work?",
    a: `Free members get ${config.freeUnlocksPerDay} prompt unlocks per day by watching a short ad. Pro members unlock instantly, with no ads and no daily limit.`,
  },
];

/** Native <details> accordion — no JS required, fully indexable. */
export function ProFaq() {
  return (
    <section aria-labelledby="faq-heading" className="mx-auto max-w-2xl">
      <h2 id="faq-heading" className="text-center font-display text-h2 font-semibold text-hi">
        Questions
      </h2>

      <div className="mt-5 space-y-3">
        {FAQ.map(({ q, a }) => (
          <details
            key={q}
            className="group rounded-card border border-hairline bg-surface px-5 py-4 transition-colors hover:border-cyan/30"
          >
            <summary className="flex min-h-6 cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-hi [&::-webkit-details-marker]:hidden">
              {q}
              <ChevronDown
                aria-hidden
                className="h-4 w-4 shrink-0 text-mid transition-transform duration-base group-open:rotate-180"
              />
            </summary>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-mid">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
