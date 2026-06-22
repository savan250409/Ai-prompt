"use client";

import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { PromptListItem } from "@/lib/types";
import { PromptCard } from "./prompt-card";
import { EmptyState } from "@/components/ui/empty-state";

interface Page {
  items: PromptListItem[];
  nextSkip: number | null;
}

const TAKE = 24;

/**
 * Masonry of prompt thumbnails with infinite scroll (§6). Seeded from SSR so
 * the first paint needs no client fetch; subsequent pages load on scroll.
 */
export function PromptMasonry({
  kind,
  categoryId,
  initialItems,
  initialNextSkip,
}: {
  kind: "video" | "image";
  categoryId: string;
  initialItems: PromptListItem[];
  initialNextSkip: number | null;
}) {
  const base =
    kind === "video"
      ? `/api/video-categories/${categoryId}/videos`
      : `/api/image-categories/${categoryId}/images`;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["prompts", kind, categoryId],
    queryFn: async ({ pageParam }): Promise<Page> => {
      const res = await fetch(`${base}?skip=${pageParam}&take=${TAKE}`);
      if (!res.ok) throw new Error("Failed to load prompts");
      return res.json();
    },
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextSkip ?? undefined,
    initialData: {
      pages: [{ items: initialItems, nextSkip: initialNextSkip }],
      pageParams: [0],
    },
  });

  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasNextPage) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  if (items.length === 0) {
    return (
      <EmptyState
        title="No prompts here yet"
        hint="This collection is still being curated. Explore another category in the meantime."
      />
    );
  }

  return (
    <>
      <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
        {items.map((item, i) => (
          <div key={item.id} className="break-inside-avoid">
            <PromptCard item={item} priority={i < 4} />
          </div>
        ))}
      </div>

      <div ref={sentinel} className="flex justify-center py-8">
        {isFetchingNextPage && (
          <span className="inline-flex items-center gap-2 text-caption text-mid">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading more…
          </span>
        )}
      </div>
    </>
  );
}
