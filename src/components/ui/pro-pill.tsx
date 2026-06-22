"use client";

import Link from "next/link";
import { Gem } from "lucide-react";
import { useSession, selectIsPro } from "@/store/session";
import { cn } from "@/lib/utils";

/**
 * Gold Pro pill — present in the header on every screen (§5, §11.7).
 * Active (Pro) shows status; otherwise it's the upsell linking to /pricing.
 */
export function ProPill({ className }: { className?: string }) {
  const isPro = useSession(selectIsPro);

  if (isPro) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-pill bg-grad-gold px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-gold-ink shadow-glow-gold",
          className,
        )}
      >
        <Gem className="h-3.5 w-3.5" />
        Pro
      </span>
    );
  }

  return (
    <Link
      href="/pricing"
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-gold ring-gold transition-all duration-base hover:bg-grad-gold hover:text-gold-ink hover:shadow-glow-gold",
        className,
      )}
    >
      <Gem className="h-3.5 w-3.5" />
      Go Pro
    </Link>
  );
}
