import "server-only";
import { store } from "@/server/store";
import { catalog } from "@/data/catalog";
import type { FilterItem, PromptListItem } from "@/lib/types";

export type ResolvedFavorite =
  | { kind: "prompt"; favId: string; item: PromptListItem }
  | { kind: "filter"; favId: string; item: FilterItem };

/** Resolve a user's saved (itemType,itemId) favorites to displayable items. */
export async function resolveFavorites(userId: string): Promise<ResolvedFavorite[]> {
  const favs = await store.favorites.list(userId);
  const resolved = await Promise.all(
    favs.map(async (f): Promise<ResolvedFavorite | null> => {
      if (f.itemType === "video") {
        const d = await catalog.videoDetail(f.itemId, false);
        return d ? { kind: "prompt", favId: f.id, item: d } : null;
      }
      if (f.itemType === "image") {
        const d = await catalog.imageDetail(f.itemId, false);
        return d ? { kind: "prompt", favId: f.id, item: d } : null;
      }
      const d = await catalog.filterDetail(f.itemId);
      return d ? { kind: "filter", favId: f.id, item: d } : null;
    }),
  );
  return resolved.filter((r): r is ResolvedFavorite => r !== null);
}
