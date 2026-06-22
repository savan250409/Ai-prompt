import type { Me } from "@/lib/types";
import { auth } from "@/server/auth";
import { store } from "@/server/store";
import { startOfTodayUTC } from "@/server/entitlements";
import { config } from "@/lib/config";
import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Current user + Pro status + coin balance + free-unlock quota (§8). */
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    const guest: Me = {
      authenticated: false,
      user: null,
      isPro: false,
      coins: 0,
      freeUnlocksRemaining: config.freeUnlocksPerDay,
    };
    return ok(guest);
  }

  const user = await store.users.findById(userId);
  if (!user) {
    const guest: Me = {
      authenticated: false,
      user: null,
      isPro: false,
      coins: 0,
      freeUnlocksRemaining: config.freeUnlocksPerDay,
    };
    return ok(guest);
  }

  const [isPro, coins, adUnlocks] = await Promise.all([
    store.subscriptions.isPro(userId),
    store.coins.balance(userId),
    store.unlocks.adUnlocksSince(userId, startOfTodayUTC()),
  ]);

  const me: Me = {
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.image,
      phone: user.phone,
    },
    isPro,
    coins,
    freeUnlocksRemaining: isPro
      ? config.freeUnlocksPerDay
      : Math.max(0, config.freeUnlocksPerDay - adUnlocks),
  };
  return ok(me);
}
