import "server-only";
import { store } from "@/server/store";
import { config } from "@/lib/config";
import { startOfTodayUTC } from "@/server/entitlements";

/**
 * RewardProvider — pluggable "watch ad to unlock" reward (§1.5, §9).
 * Default = free-quota: logged-in free users get FREE_UNLOCKS_PER_DAY ad-method
 * unlocks/day; beyond that we upsell Pro. AdMob rewarded video does not work on
 * the web, so this is the seam for a real web ad network later.
 */
export interface RewardEligibility {
  eligible: boolean;
  remaining: number;
  limit: number;
}

export interface RewardProvider {
  /** How many free ad-unlocks remain for this user today. */
  checkEligibility(userId: string): Promise<RewardEligibility>;
}

class FreeQuotaRewardProvider implements RewardProvider {
  async checkEligibility(userId: string): Promise<RewardEligibility> {
    const limit = config.freeUnlocksPerDay;
    const used = await store.unlocks.adUnlocksSince(userId, startOfTodayUTC());
    const remaining = Math.max(0, limit - used);
    return { eligible: remaining > 0, remaining, limit };
  }
}

// TODO(integration): swap for a real web rewarded-ad provider when available;
// keep this interface so the unlock flow needs no changes.
export const rewardProvider: RewardProvider = new FreeQuotaRewardProvider();
