import { performUnlock } from "@/server/unlock";
import { ok, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Unlock a prompt (Pro instant, or free-quota ad path) — §7, §8. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    itemType?: string;
    itemId?: string;
    method?: string;
  } | null;

  const itemType = body?.itemType;
  const itemId = body?.itemId;
  const method = body?.method;

  if (
    (itemType !== "video" && itemType !== "image") ||
    typeof itemId !== "string" ||
    (method !== "pro" && method !== "ad")
  ) {
    return fail(400, "Invalid unlock request");
  }

  const result = await performUnlock(itemType, itemId, method);
  if (!result.ok) {
    return fail(result.status, result.error, result.remaining != null ? { remaining: result.remaining } : undefined);
  }
  return ok({ unlocked: true, prompt: result.prompt, method: result.method });
}
