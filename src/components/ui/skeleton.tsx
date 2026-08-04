import { cn } from "@/lib/utils";

/** Shimmer skeleton — used everywhere instead of blank flashes (§11.7). */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-card", className)} aria-hidden />;
}
