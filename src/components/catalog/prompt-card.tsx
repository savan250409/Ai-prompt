"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Gem, Lock, Play } from "lucide-react";
import type { PromptListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function promptHref(item: Pick<PromptListItem, "kind" | "id">) {
  return item.kind === "video" ? `/videos/prompt/${item.id}` : `/images/prompt/${item.id}`;
}

/**
 * Catalog prompt card — edge-to-edge media, gradient-scrim label, Pro/Exclusive
 * gold treatment (§11.7). Desktop hover: lift + scale + preview video plays;
 * video is lazy-mounted on hover and paused on leave (§11.8).
 */
export function PromptCard({
  item,
  priority,
  className,
}: {
  item: PromptListItem;
  priority?: boolean;
  className?: string;
}) {
  const [reduce, setReduce] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  const [hovering, setHovering] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const isVideo = item.kind === "video" && !!item.preview && !videoFailed;

  function onEnter() {
    setHovering(true);
    if (isVideo && !reduce) {
      // mount happens via state; play on next tick
      requestAnimationFrame(() => videoRef.current?.play().catch(() => {}));
    }
  }
  function onLeave() {
    setHovering(false);
    setPlaying(false);
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  }

  // pass the category as a hint so the detail page loads from ONE category
  // fetch (often already cached) instead of building a cross-category index.
  const href = item.categoryId
    ? `${promptHref(item)}?c=${encodeURIComponent(item.categoryId)}`
    : promptHref(item);

  return (
    <Link
      href={href}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={cn(
        "group relative block overflow-hidden rounded-card border border-hairline bg-surface-2 shadow-card outline-none transition-all duration-base ease-out-expo hover:-translate-y-1.5 hover:shadow-card-hover focus-visible:-translate-y-1.5",
        item.exclusive && "ring-gold",
        className,
      )}
      style={{ aspectRatio: String(item.aspect ?? 0.75) }}
    >
      {/* base thumbnail */}
      {item.thumbnail ? (
        <Image
          src={item.thumbnail}
          alt={item.hint ?? "AI prompt preview"}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 22vw"
          priority={priority}
          className={cn(
            // VISIBLE by default (CSS fade, no JS) so the grid shows instantly on
            // a hard load; only hidden while the hover-preview video is playing.
            "animate-media-in object-cover transition-transform duration-slow ease-out-expo group-hover:scale-[1.04]",
            isVideo && playing && "opacity-0",
          )}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-surface-2 text-low">No preview</div>
      )}

      {/* hover preview video (lazy-mounted, layered OVER the still). It only
          reveals the still beneath once it's playing; on load failure it falls
          back to the thumbnail (videoFailed flips isVideo off). */}
      {isVideo && hovering && !reduce && (
        <video
          ref={videoRef}
          src={item.preview!}
          poster={item.thumbnail ?? undefined}
          muted
          loop
          playsInline
          preload="none"
          onPlaying={() => setPlaying(true)}
          onError={() => {
            setVideoFailed(true);
            setPlaying(false);
          }}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-base",
            playing ? "opacity-100" : "opacity-0",
          )}
        />
      )}

      {/* scrim + label */}
      <div className="media-scrim pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
        <span className="line-clamp-1 text-caption font-medium text-white/90">{item.hint}</span>
        {item.count > 1 && (
          <span className="shrink-0 rounded-pill bg-black/45 px-2 py-0.5 font-mono text-[11px] text-white/90">
            ×{item.count}
          </span>
        )}
      </div>

      {/* top-right badges */}
      <div className="pointer-events-none absolute right-2.5 top-2.5 flex items-center gap-1.5">
        {item.exclusive && (
          <span className="inline-flex items-center gap-1 rounded-pill bg-grad-gold px-2 py-0.5 text-[10px] font-semibold uppercase text-gold-ink shadow-glow-gold">
            <Gem className="h-3 w-3" />
            Pro
          </span>
        )}
        <span className="grid h-6 w-6 place-items-center rounded-pill bg-black/45 text-white/85 backdrop-blur-sm">
          {isVideo ? <Play className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
        </span>
      </div>
    </Link>
  );
}
