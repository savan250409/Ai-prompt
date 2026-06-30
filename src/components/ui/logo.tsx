import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Prompt Studio — home"
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-grad-electric shadow-glow transition-transform duration-base ease-out-expo group-hover:scale-105">
        <Sparkles className="h-5 w-5 text-on-electric" />
      </span>
      {!compact && (
        <span className="font-display text-lg font-semibold tracking-tight text-hi">
          Prompt <span className="text-gradient-electric">Studio</span>
        </span>
      )}
    </Link>
  );
}
