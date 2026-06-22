import "server-only";
import { store } from "@/server/store";
import { rewardProvider } from "@/server/reward";
import { catalog } from "@/data/catalog";
import { getViewer } from "@/server/entitlements";

export type UnlockMethod = "pro" | "ad";

export type UnlockResult =
  | { ok: true; prompt: string; method: UnlockMethod }
  | { ok: false; status: number; error: string; remaining?: number };

/**
 * Unlock a prompt for the current viewer — server-enforced (§1, §6, §7).
 * Pro => instant (method=pro). Else the free-quota reward path (method=ad).
 * Records prompt_unlocks so the unlock persists per user. Idempotent.
 */
export async function performUnlock(
  itemType: "video" | "image",
  itemId: string,
  requested: UnlockMethod,
): Promise<UnlockResult> {
  const viewer = await getViewer();
  if (!viewer.userId) return { ok: false, status: 401, error: "Sign in to unlock prompts." };

  // The full prompt is only ever read here, server-side, after the check.
  const prompt = await catalog.rawPrompt(itemType, itemId);
  if (prompt == null) return { ok: false, status: 404, error: "Prompt not found." };

  // Pro => instant unlock; persist so it survives a later downgrade.
  if (viewer.isPro) {
    await store.unlocks.record(viewer.userId, itemType, itemId, "pro");
    return { ok: true, prompt, method: "pro" };
  }

  // Already unlocked (prior ad/pro) => idempotent success.
  if (await store.unlocks.isUnlocked(viewer.userId, itemType, itemId)) {
    return { ok: true, prompt, method: "ad" };
  }

  if (requested === "pro") {
    return { ok: false, status: 402, error: "Upgrade to Pro to unlock without ads." };
  }

  // Free-quota ("watch ad") path.
  const elig = await rewardProvider.checkEligibility(viewer.userId);
  if (!elig.eligible) {
    return {
      ok: false,
      status: 429,
      error: "You've used your free unlocks for today. Go Pro for unlimited.",
      remaining: 0,
    };
  }
  await store.unlocks.record(viewer.userId, itemType, itemId, "ad");
  return { ok: true, prompt, method: "ad" };
}
