"use client";

import { Lock } from "lucide-react";
import { BrandIcon, BRAND_LABELS, type Brand } from "@/components/ui/brand-icons";
import { IMAGE_ASPECTS } from "@/lib/aspects";
import { cn } from "@/lib/utils";

/** Which platforms each ratio is typically used for. */
const RATIO_BRANDS: Record<string, Brand[]> = {
  "1:1": ["instagram", "facebook"],
  "9:16": ["tiktok", "instagram"],
  "16:9": ["youtube", "x"],
  "3:2": ["pinterest"],
  "2:3": ["pinterest"],
  "4:3": ["facebook"],
  "3:4": ["facebook", "instagram"],
  "4:5": ["instagram", "facebook"],
  "5:4": ["instagram", "facebook"],
  "21:9": ["youtube"],
};

function parse(ratio: string): { w: number; h: number } {
  const [w, h] = ratio.split(":").map(Number);
  return { w: w || 1, h: h || 1 };
}

/**
 * Aspect-ratio picker — a scrollable row of cards. Each card's preview box is
 * drawn at the true ratio and carries the platform glyphs that ratio suits, so
 * the shape is readable at a glance. Locked ratios (Pro-only) show a lock.
 */
export function AspectPicker({
  name,
  value,
  onChange,
  options = IMAGE_ASPECTS,
  lockedValues,
  onLocked,
  label = "Aspect ratio",
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options?: string[];
  lockedValues?: string[];
  onLocked?: (v: string) => void;
  label?: string;
}) {
  return (
    // min-w-0: a grid/flex item defaults to min-width:auto, which would let the
    // scroller below stretch to its content (~930px) and blow out the page.
    <div className="min-w-0">
      <p className="mb-2 text-caption font-medium text-mid">{label}</p>

      {/* row scrolls inside itself; the page never scrolls sideways */}
      <div
        role="radiogroup"
        aria-label={label}
        className="-mx-1 flex min-w-0 snap-x gap-2.5 overflow-x-auto px-1 pb-2"
      >
        {options.map((ratio) => {
          const { w, h } = parse(ratio);
          const portrait = h > w;
          const selected = ratio === value;
          const locked = lockedValues?.includes(ratio) ?? false;
          const brands = RATIO_BRANDS[ratio] ?? [];

          return (
            <button
              key={ratio}
              type="button"
              role="radio"
              name={name}
              aria-checked={selected}
              aria-disabled={locked}
              onClick={() => (locked ? onLocked?.(ratio) : onChange(ratio))}
              className={cn(
                "group relative flex w-[5.25rem] shrink-0 snap-start flex-col items-center gap-2 rounded-card border px-3 py-3 transition-all duration-base ease-out-expo",
                selected
                  ? "border-cyan bg-surface-2 shadow-glow"
                  : "border-hairline bg-surface hover:border-cyan/40 hover:bg-surface-2",
                locked && "opacity-60",
              )}
            >
              {/* Fixed square tile; only the ICON LAYOUT reflects the orientation
                  (stacked for portrait, side-by-side otherwise) so glyphs never
                  crowd each other on extreme ratios like 9:16 or 21:9. */}
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-lg border transition-colors",
                  portrait ? "flex-col gap-1" : "flex-row gap-1.5",
                  selected ? "border-cyan/50 bg-cyan/10" : "border-hairline bg-surface-2",
                )}
              >
                {brands.map((b) => (
                  <BrandIcon
                    key={b}
                    brand={b}
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      locked ? "text-low" : selected ? "text-cyan" : "text-mid",
                    )}
                  />
                ))}
              </span>

              {/* lock badge — keeps the platform glyphs visible underneath */}
              {locked && (
                <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-surface-2 text-low ring-1 ring-hairline">
                  <Lock className="h-2.5 w-2.5" />
                </span>
              )}

              <span
                className={cn(
                  "whitespace-nowrap font-mono text-caption font-medium leading-none",
                  selected ? "text-cyan" : "text-mid",
                )}
              >
                {ratio}
              </span>

              {/* names the option properly for screen readers */}
              <span className="sr-only">
                {locked ? "Locked, Pro only. " : ""}
                {brands.length > 0 && `Suits ${brands.map((b) => BRAND_LABELS[b]).join(", ")}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
