import { getViewer } from "@/server/entitlements";
import { store } from "@/server/store";
import type { ItemType } from "@/lib/types";
import { ok, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

const TYPES: ItemType[] = ["video", "image", "filter"];

export async function GET() {
  const viewer = await getViewer();
  if (!viewer.userId) return ok({ favorites: [] });
  const favs = await store.favorites.list(viewer.userId);
  return ok({ favorites: favs.map((f) => ({ id: f.id, itemType: f.itemType, itemId: f.itemId })) });
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer.userId) return fail(401, "Sign in to save favorites.");
  const body = (await req.json().catch(() => null)) as { itemType?: string; itemId?: string } | null;
  const itemType = body?.itemType as ItemType | undefined;
  const itemId = body?.itemId;
  if (!itemType || !TYPES.includes(itemType) || typeof itemId !== "string") {
    return fail(400, "Invalid favorite");
  }
  const fav = await store.favorites.add(viewer.userId, itemType, itemId);
  return ok({ favorited: true, id: fav.id });
}
