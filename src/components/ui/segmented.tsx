"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/** Animated sliding-pill toggle — §11.6 (6s/12s, 480p/720p, aspect ratios).
 *  Options listed in `lockedValues` show a lock and call `onLocked` on click
 *  (e.g. Pro-only aspect ratios for free users) instead of selecting. */
export function Segmented<T extends string | number>({
  name,
  options,
  value,
  onChange,
  label,
  lockedValues,
  onLocked,
}: {
  name: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
  lockedValues?: T[];
  onLocked?: (v: T) => void;
}) {
  return (
    <div>
      {label && <p className="mb-1.5 text-caption font-medium text-mid">{label}</p>}
      <div className="inline-flex flex-wrap gap-1 rounded-pill border border-hairline bg-surface-2 p-1">
        {options.map((o) => {
          const active = o.value === value;
          const locked = lockedValues?.includes(o.value) ?? false;
          return (
            <button
              key={String(o.value)}
              type="button"
              onClick={() => (locked ? onLocked?.(o.value) : onChange(o.value))}
              aria-pressed={active}
              aria-disabled={locked}
              className={cn(
                "relative inline-flex items-center gap-1 rounded-pill px-4 py-1.5 text-sm font-medium transition-colors duration-base",
                active ? "text-on-electric" : locked ? "text-low hover:text-mid" : "text-mid hover:text-hi",
              )}
            >
              {active && (
                <motion.span
                  layoutId={`seg-${name}`}
                  className="absolute inset-0 rounded-pill bg-grad-electric shadow-glow"
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                />
              )}
              <span className="relative inline-flex items-center gap-1">
                {locked && <Lock className="h-3 w-3" />}
                {o.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
