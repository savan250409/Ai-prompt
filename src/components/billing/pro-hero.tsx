import { RefreshCcw, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { Container } from "@/components/layout/container";

/** Trust signals — each is factually true of this app (no invented social proof). */
const TRUST = [
  { icon: XCircle, label: "Cancel anytime" },
  { icon: ShieldCheck, label: "Secure checkout by Razorpay" },
  { icon: RefreshCcw, label: "Coins refunded if a generation fails" },
];

/** Go Pro hero — value prop first, then the plans below. Server-rendered. */
export function ProHero() {
  return (
    <section className="relative overflow-hidden border-b border-hairline">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 h-64 bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_srgb,var(--blue)_22%,transparent),transparent)]"
      />
      <Container className="relative py-14 text-center md:py-20">
        <span className="inline-flex items-center gap-2 rounded-pill border border-hairline bg-glass px-3.5 py-1.5 text-caption font-medium text-mid backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-cyan" />
          Pricing
        </span>

        <h1 className="mt-5 text-balance font-display text-display font-semibold tracking-tight text-hi">
          Create without <span className="text-gradient-electric">limits</span>.
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-mid sm:text-lg">
          Unlock every prompt, generate AI images &amp; video, and lose the ads. Pick a plan, or
          just top up coins — your call.
        </p>

        <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {TRUST.map(({ icon: Icon, label }) => (
            <li key={label} className="inline-flex items-center gap-2 text-caption text-mid">
              <Icon className="h-4 w-4 shrink-0 text-cyan" />
              {label}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
