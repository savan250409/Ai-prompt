import Link from "next/link";
import { Check, Gem } from "lucide-react";
import { buttonClass } from "@/components/ui/button-variants";

const BENEFITS = [
  "No ads, ever",
  "Infinite photo & video prompts + exclusive content",
  "AI image & video generation",
  "Unlock all aspect ratios",
];

/** Gold Exclusive/Pro spotlight band — §6, §11.2 (gold used here only). */
export function ProSpotlight() {
  return (
    <section className="relative overflow-hidden rounded-modal border border-hairline bg-surface p-8 ring-gold md:p-12">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-grad-gold opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-grad-gold opacity-10 blur-3xl" />
      <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-grad-gold px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gold-ink shadow-glow-gold">
            <Gem className="h-3.5 w-3.5" />
            Exclusive
          </span>
          <h2 className="mt-4 font-display text-h1 font-semibold text-hi">
            Unlock the full studio with Pro
          </h2>
          <p className="mt-3 max-w-md text-mid">
            Go unlimited — every prompt, every tool, no ads. Generate cinematic
            images and video, and unlock every aspect ratio.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/pricing" className={buttonClass({ variant: "pro", size: "lg" })}>
              <Gem className="h-4 w-4" />
              Go Pro
            </Link>
            <Link href="/pricing" className={buttonClass({ variant: "secondary", size: "lg" })}>
              See plans
            </Link>
          </div>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
          {BENEFITS.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2.5 rounded-2xl border border-hairline bg-surface-2/60 p-3.5"
            >
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-grad-gold text-gold-ink">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              <span className="text-sm text-hi">{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
