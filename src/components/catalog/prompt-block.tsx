"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const GLYPHS = "!<>-_\\/[]{}=+*^?#·:;~";

/**
 * The prompt surface — §11.5 (Prompt Reveal).
 * LOCKED: truncated preview behind a frosted "encrypted" blur + scanline.
 * UNLOCKED: full mono prompt. When `reveal` is set, glyphs scramble→resolve
 * left-to-right with a gold shimmer sweep (~900ms, skippable; reduced-motion =
 * fade). The full prompt only arrives here once the server confirms unlock (§6).
 */
export function PromptBlock({
  preview,
  prompt,
  unlocked,
  reveal = false,
  className,
}: {
  preview: string;
  prompt: string | null;
  unlocked: boolean;
  reveal?: boolean;
  className?: string;
}) {
  if (unlocked && prompt) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-input border border-hairline bg-ink/60 p-4",
          className,
        )}
      >
        {reveal ? <RevealText text={prompt} /> : (
          <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-hi">{prompt}</p>
        )}
        {reveal && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-input motion-reduce:hidden"
          >
            <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-gold/40 to-transparent animate-gold-sweep" />
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative min-h-[7rem] overflow-hidden rounded-input border border-hairline bg-surface-2 p-4",
        className,
      )}
    >
      <p
        aria-hidden
        className="select-none whitespace-pre-wrap font-mono text-sm leading-relaxed text-mid blur-[3.5px]"
      >
        {preview}
      </p>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 -top-8 h-10 bg-gradient-to-b from-cyan/15 to-transparent animate-scanline" />
      </div>
      <div className="absolute inset-0 grid place-items-center">
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-glass px-3 py-1.5 text-caption font-medium text-hi backdrop-blur">
          <Lock className="h-3.5 w-3.5 text-cyan" />
          Locked
        </span>
      </div>
      <span className="sr-only">Prompt is locked. Unlock to reveal the full text.</span>
    </div>
  );
}

function RevealText({ text }: { text: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLPreElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduce) {
      node.textContent = text;
      setDone(true);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 900;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const revealed = Math.floor(p * text.length);
      let out = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (i < revealed || ch === " " || ch === "\n") out += ch;
        else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      node.textContent = out;
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        node.textContent = text;
        setDone(true);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, reduce]);

  return (
    <pre
      ref={ref}
      aria-label={done ? undefined : "Revealing prompt"}
      className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-hi"
    >
      {text}
    </pre>
  );
}
