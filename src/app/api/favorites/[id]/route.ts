import { getViewer } from "@/server/entitlements";
import { store } from "@/server/store";
import type { ItemType } from "@/lib/types";
import { ok, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

const TYPES: ItemType[] = ["video", "image", "filter"];

/** Remove a favorite. `id` is the composite `itemType:itemId`. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer.userId) return fail(401, "Sign in first.");

  const { id } = await params;
  const idx = id.indexOf(":");
  const itemType = (idx >= 0 ? id.slice(0, idx) : "") as ItemType;
  const itemId = idx >= 0 ? id.slice(idx + 1) : "";
  if (!TYPES.includes(itemType) || !itemId) return fail(400, "Invalid favorite id");

  await store.favorites.remove(viewer.userId, itemType, itemId);
  return ok({ favorited: false });
}
