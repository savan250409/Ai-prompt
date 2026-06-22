"use client";

import { useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { Gem } from "lucide-react";
import type { PromptDetail } from "@/lib/types";

/** Cinematic preview frame on the detail page — looping video or still (§6). */
export function PreviewStage({ item }: { item: PromptDetail }) {
  const reduce = useReducedMotion();
  const [videoFailed, setVideoFailed] = useState(false);
  const isVideo = item.kind === "video" && Boolean(item.preview) && !videoFailed;

  return (
    <div
      className="relative overflow-hidden rounded-card border border-hairline bg-surface-2 shadow-card"
      style={{ aspectRatio: String(item.aspect ?? 0.75) }}
    >
      {isVideo && !reduce ? (
        <video
          src={item.preview!}
          autoPlay
          muted
          loop
          playsInline
          poster={item.thumbnail ?? undefined}
          onError={() => setVideoFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : item.thumbnail ? (
        <Image
          src={item.thumbnail}
          alt={item.hint ?? "AI prompt preview"}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          className="object-cover"
        />
      ) : (
        <div className="grid h-full place-items-center text-low">No preview</div>
      )}

      <div className="media-scrim pointer-events-none absolute inset-0" />

      {item.exclusive && (
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-pill bg-grad-gold px-2.5 py-1 text-[11px] font-semibold uppercase text-gold-ink shadow-glow-gold">
          <Gem className="h-3 w-3" />
          Exclusive
        </span>
      )}
    </div>
  );
}
