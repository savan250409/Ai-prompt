"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Download, ImageOff, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonClass } from "@/components/ui/button-variants";
import type { GenResult, GenState } from "./use-generation";

/** Generation result — resolves from a shimmer/de-noise pass (§11.5.4). */
export function SummonResult({
  state,
  result,
  onReset,
  ratio = 1,
}: {
  state: GenState;
  result: GenResult | null;
  onReset: () => void;
  ratio?: number;
}) {
  const reduce = useReducedMotion();
  if (state === "idle") return null;

  return (
    <div className="space-y-4">
      <div
        className="relative overflow-hidden rounded-card border border-hairline bg-surface-2"
        style={{ aspectRatio: String(ratio) }}
      >
        {state === "running" && <SummonShimmer />}

        {state === "done" && result && (
          <motion.div
            className="absolute inset-0"
            initial={reduce ? { opacity: 0 } : { filter: "blur(16px)", opacity: 0.3, scale: 1.05 }}
            animate={reduce ? { opacity: 1 } : { filter: "blur(0px)", opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {result.kind === "video" ? (
              <video
                src={result.url}
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={result.url} alt="Generated result" className="h-full w-full object-cover" />
            )}
          </motion.div>
        )}

        {state === "failed" && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-mid">
            <ImageOff className="h-8 w-8" />
            <p className="text-caption">That didn&rsquo;t work — your coins were refunded.</p>
          </div>
        )}
      </div>

      {state === "done" && result && (
        <div className="flex flex-wrap items-center gap-2.5">
          <a href={result.url} download className={buttonClass({ variant: "primary" })}>
            <Download className="h-4 w-4" />
            Download
          </a>
          <Button variant="secondary" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
            Generate again
          </Button>
          <Link
            href="/account/media"
            className="text-sm font-medium text-cyan transition-colors hover:text-blue"
          >
            View in My Media
          </Link>
        </div>
      )}

      {state === "failed" && (
        <Button variant="secondary" onClick={onReset}>
          <RotateCcw className="h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  );
}

function SummonShimmer() {
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0 animate-shimmer-bg"
        style={{
          backgroundImage:
            "linear-gradient(110deg, var(--slate-2) 8%, color-mix(in srgb, var(--cyan) 18%, var(--slate-2)) 18%, var(--slate-2) 33%)",
          backgroundSize: "200% 100%",
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-mid">
        <span className="grid h-12 w-12 place-items-center rounded-pill bg-grad-electric text-on-electric shadow-glow">
          <Sparkles className="h-6 w-6 animate-pulse" />
        </span>
        <p className="text-caption font-medium">Summoning your media…</p>
      </div>
    </div>
  );
}
