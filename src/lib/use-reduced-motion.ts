"use client";

import { useEffect, useState } from "react";

/**
 * Native `prefers-reduced-motion` hook — drop-in for framer-motion's
 * useReducedMotion, but with zero bundle cost. Returns false on the server and
 * during the first client render (so SSR/hydration match), then the real value.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
