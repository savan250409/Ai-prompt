"use client";

import { useEffect, useRef } from "react";

/** Count-up / coin-roll — §11.6. Tweens whenever `value` changes (native rAF). */
export function AnimatedNumber({
  value,
  className,
  duration = 0.6,
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = prev.current;
    prev.current = value;
    if (reduce || from === value) {
      node.textContent = value.toLocaleString("en-IN");
      return;
    }
    let raf = 0;
    const start = performance.now();
    const ms = Math.max(1, duration * 1000);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      node.textContent = Math.round(from + (value - from) * eased).toLocaleString("en-IN");
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {value.toLocaleString("en-IN")}
    </span>
  );
}
