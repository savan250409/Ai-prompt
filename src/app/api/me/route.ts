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

  const guest: Me = {
    authenticated: false,
    user: null,
    isPro: false,
    plan: null,
    planStatus: null,
    coins: 0,
    freeUnlocksRemaining: config.freeUnlocksPerDay,
  };

  if (!userId) return ok(guest);

  const user = await store.users.findById(userId);
  if (!user) return ok(guest);

  const [sub, coins, adUnlocks] = await Promise.all([
    store.subscriptions.activeFor(userId),
    store.coins.balance(userId),
    store.unlocks.adUnlocksSince(userId, startOfTodayUTC()),
  ]);
  const isPro = sub !== null;

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
    plan: sub?.plan ?? null,
    planStatus: sub?.status === "cancelled" ? "cancelled" : isPro ? "active" : null,
    coins,
    freeUnlocksRemaining: isPro
      ? config.freeUnlocksPerDay
      : Math.max(0, config.freeUnlocksPerDay - adUnlocks),
  };
  return ok(me);
}
