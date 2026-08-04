"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock, Download, ImageOff } from "lucide-react";
import { downloadHref } from "@/lib/utils";
import type { Generation } from "@/lib/types";

/** Grid of past generations (§6 My Media). Polls while any item is processing. */
export function MyMediaGrid({ items }: { items: Generation[] }) {
  const { data } = useQuery({
    queryKey: ["generations"],
    queryFn: async (): Promise<{ generations: Generation[] }> => {
      const res = await fetch("/api/generations");
      if (!res.ok) throw new Error("Failed to load media");
      return res.json();
    },
    initialData: { generations: items },
    refetchInterval: (q) =>
      q.state.data?.generations.some((g) => g.status === "processing" || g.status === "queued")
        ? 2000
        : false,
  });

  const generations = data?.generations ?? items;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {generations.map((g) => (
        <div
          key={g.id}
          className="group relative aspect-square overflow-hidden rounded-card border border-hairline bg-surface-2"
        >
          {g.status === "done" && g.outputMediaPath ? (
            g.kind === "video" ? (
              <video
                src={g.outputMediaPath}
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
                className="h-full w-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={g.outputMediaPath} alt={g.kind} className="h-full w-full object-cover" />
            )
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-low">
              {g.status === "failed" ? (
                <ImageOff className="h-6 w-6" />
              ) : (
                <Clock className="h-6 w-6 animate-pulse" />
              )}
              <span className="text-caption capitalize">{g.status}</span>
            </div>
          )}
          {g.status === "done" && g.outputMediaPath && (
            <a
              href={downloadHref(g.outputMediaPath)}
              download
              className="glass absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-pill text-hi opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Download"
            >
              <Download className="h-4 w-4" />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
