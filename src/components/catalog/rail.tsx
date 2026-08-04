"use client";

import { Children, useCallback, useEffect, useState, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Horizontal rail — snap-scroll/drag on mobile, arrow controls on desktop (§6).
 * Each child becomes a slide; control width via `slideClassName`.
 */
export function Rail({
  children,
  slideClassName,
  className,
}: {
  children: ReactNode;
  slideClassName?: string;
  className?: string;
}) {
  const [emblaRef, embla] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!embla) return;
    setCanPrev(embla.canScrollPrev());
    setCanNext(embla.canScrollNext());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    onSelect();
    embla.on("select", onSelect);
    embla.on("reInit", onSelect);
    return () => {
      embla.off("select", onSelect);
      embla.off("reInit", onSelect);
    };
  }, [embla, onSelect]);

  return (
    <div className={cn("group/rail relative", className)}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {Children.map(children, (child, i) => (
            <div
              key={i}
              className={cn(
                "min-w-0 shrink-0 basis-[68%] sm:basis-[42%] md:basis-[30%] lg:basis-[22%]",
                slideClassName,
              )}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      <RailButton dir="prev" disabled={!canPrev} onClick={() => embla?.scrollPrev()} />
      <RailButton dir="next" disabled={!canNext} onClick={() => embla?.scrollNext()} />
    </div>
  );
}

function RailButton({
  dir,
  disabled,
  onClick,
}: {
  dir: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={dir === "prev" ? "Scroll left" : "Scroll right"}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "glass absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-pill text-hi shadow-card transition-all duration-base md:grid",
        dir === "prev" ? "-left-3" : "-right-3",
        disabled
          ? "pointer-events-none opacity-0"
          : "opacity-0 group-hover/rail:opacity-100 hover:scale-105",
      )}
    >
      {dir === "prev" ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
    </button>
  );
}
