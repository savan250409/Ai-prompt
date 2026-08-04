"use client";

import Link from "next/link";
import { Coins } from "lucide-react";
import { useSession } from "@/store/session";
import { AnimatedNumber } from "./animated-number";
import { cn } from "@/lib/utils";

/** Coin balance chip (header). Hidden until authenticated — §6, §8. */
export function CoinChip({ className }: { className?: string }) {
  const me = useSession((s) => s.me);
  if (!me?.authenticated) return null;

  return (
    <Link
      href="/account/billing"
      aria-label={`${me.coins} coins — manage billing`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border border-hairline bg-surface-2/60 px-3 py-1.5 transition-colors duration-base hover:bg-surface-2",
        className,
      )}
    >
      <Coins className="h-4 w-4 text-gold" />
      <AnimatedNumber value={me.coins} className="font-mono tabular text-sm font-medium text-hi" />
    </Link>
  );
}
