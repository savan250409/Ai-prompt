"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Animated sliding-pill toggle — §11.6 (6s/12s, 480p/720p, aspect ratios). */
export function Segmented<T extends string | number>({
  name,
  options,
  value,
  onChange,
  label,
}: {
  name: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <div>
      {label && <p className="mb-1.5 text-caption font-medium text-mid">{label}</p>}
      <div className="inline-flex rounded-pill border border-hairline bg-surface-2 p-1">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={active}
              className={cn(
                "relative rounded-pill px-4 py-1.5 text-sm font-medium transition-colors duration-base",
                active ? "text-on-electric" : "text-mid hover:text-hi",
              )}
            >
              {active && (
                <motion.span
                  layoutId={`seg-${name}`}
                  className="absolute inset-0 rounded-pill bg-grad-electric shadow-glow"
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                />
              )}
              <span className="relative">{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
