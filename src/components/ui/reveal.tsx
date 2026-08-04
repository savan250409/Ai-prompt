import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Entrance reveal — opacity + 16px rise (§11.6). Pure CSS animation that runs on
 * paint and completes WITHOUT JavaScript, so the content is visible immediately
 * on a hard load instead of waiting for hydration. Reduced-motion users get the
 * content with no movement (the animation is opacity/transform only and short).
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("motion-safe:animate-fade-rise", className)}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
