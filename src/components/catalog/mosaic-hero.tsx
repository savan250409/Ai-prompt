"use client";

import { SmoothImage } from "@/components/ui/smooth-image";
import Link from "next/link";
import { ArrowRight, Gem, Sparkles } from "lucide-react";
import { buttonClass } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

/**
 * Signature: living hero mosaic — §11.5.2. A very slow parallax wall of best
 * media behind the value prop; pauses on interaction; static under reduced motion.
 */
export function MosaicHero({ images }: { images: string[] }) {
  const COLS = 5;
  const columns: string[][] = Array.from({ length: COLS }, () => []);
  images.forEach((src, i) => columns[i % COLS].push(src));

  return (
    <section className="group/hero relative isolate overflow-hidden">
      {/* media wall */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 flex justify-center gap-3 px-3 opacity-[0.55] [mask-image:radial-gradient(125%_92%_at_50%_28%,black,transparent_72%)]"
      >
        {columns.map((col, ci) => (
          <div
            key={ci}
            className={cn(
              "flex w-1/5 min-w-[110px] flex-col gap-3",
              ci % 2 ? "animate-marquee-down" : "animate-marquee-up",
              "group-hover/hero:[animation-play-state:paused]",
              ci > 2 && "hidden sm:flex",
            )}
            style={{ animationDuration: `${38 + ci * 6}s` }}
          >
            {[...col, ...col].map((src, i) => (
              <div
                key={i}
                className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-hairline"
              >
                <SmoothImage src={src} alt="" fill sizes="20vw" className="object-cover" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* readability scrim */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/75 via-ink/45 to-ink" />

      {/* value prop */}
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center md:py-36">
        <span className="mb-5 inline-flex items-center gap-2 rounded-pill border border-hairline bg-glass px-3.5 py-1.5 text-caption font-medium text-mid backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-cyan" />
          AI media studio · new drops every week
        </span>
        <h1 className="text-balance font-display text-display font-semibold tracking-tight text-hi">
          Prompt the <span className="text-gradient-electric">impossible</span>.
        </h1>
        <p className="mt-5 max-w-xl text-pretty text-base text-mid sm:text-lg">
          Thousands of cinematic AI photo &amp; video prompts, filters, and tools.
          Unlock, copy, and generate — all in one studio.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/images" className={buttonClass({ variant: "primary", size: "lg" })}>
            Explore prompts
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/pricing" className={buttonClass({ variant: "pro", size: "lg" })}>
            <Gem className="h-4 w-4" />
            Go Pro
          </Link>
        </div>
      </div>
    </section>
  );
}
