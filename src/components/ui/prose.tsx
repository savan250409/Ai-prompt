import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Lightweight prose styles for legal/static pages (no typography plugin). */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "max-w-2xl space-y-4 text-mid",
        "[&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-h2 [&_h2]:font-semibold [&_h2]:text-hi",
        "[&_p]:leading-relaxed [&_a]:text-cyan [&_a:hover]:text-blue",
        "[&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_strong]:text-hi",
        className,
      )}
    >
      {children}
    </div>
  );
}
