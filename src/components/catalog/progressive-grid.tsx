"use client";

import { Children, useEffect, useRef, useState } from "react";

/**
 * Renders a grid one screenful at a time. The first `step` children are shown
 * immediately (server-rendered → visible on hard load, no JS needed); each time
 * the sentinel scrolls into view the next `step` are revealed. Used where the
 * data is already fetched in one call (e.g. filters) but we still want a light
 * "load 9, then 9 more on scroll" experience without extra API requests.
 */
export function ProgressiveGrid({
  children,
  className,
  step = 9,
}: {
  children: React.ReactNode;
  className?: string;
  step?: number;
}) {
  const all = Children.toArray(children);
  const total = all.length;
  const [count, setCount] = useState(Math.min(step, total));
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || count >= total) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setCount((c) => Math.min(c + step, total));
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [count, total, step]);

  return (
    <>
      <div className={className}>{all.slice(0, count)}</div>
      {count < total && <div ref={sentinel} aria-hidden className="h-1 w-full" />}
    </>
  );
}
