import { getViewer } from "@/server/entitlements";
import { rewardProvider } from "@/server/reward";
import { config } from "@/lib/config";
import { ok, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Reward eligibility for the "watch ad" path (free-quota) — §8, §9. */
export async function POST() {
  const viewer = await getViewer();
  if (!viewer.userId) return fail(401, "Sign in first.");
  if (viewer.isPro) {
    return ok({ eligible: true, remaining: config.freeUnlocksPerDay, limit: config.freeUnlocksPerDay, pro: true });
  }
  const elig = await rewardProvider.checkEligibility(viewer.userId);
  return ok({ ...elig, pro: false });
}
