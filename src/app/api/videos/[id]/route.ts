import { catalog } from "@/data/catalog";
import { ok, fail } from "@/lib/http";
import { isPromptUnlocked } from "@/server/entitlements";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unlocked = await isPromptUnlocked("video", id);
  const detail = await catalog.videoDetail(id, unlocked);
  if (!detail) return fail(404, "Video prompt not found");
  return ok(detail);
}
