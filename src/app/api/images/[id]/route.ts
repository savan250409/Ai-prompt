import { catalog } from "@/data/catalog";
import { ok, fail } from "@/lib/http";
import { isPromptUnlocked } from "@/server/entitlements";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unlocked = await isPromptUnlocked("image", id);
  const detail = await catalog.imageDetail(id, unlocked);
  if (!detail) return fail(404, "Image prompt not found");
  return ok(detail);
}
