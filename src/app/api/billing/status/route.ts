import { getViewer } from "@/server/entitlements";
import { store } from "@/server/store";
import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Current subscription + coin balance (§8). */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer.userId) {
    return ok({ authenticated: false, isPro: false, coins: 0, subscription: null });
  }
  const [sub, coins] = await Promise.all([
    store.subscriptions.activeFor(viewer.userId),
    store.coins.balance(viewer.userId),
  ]);
  return ok({
    authenticated: true,
    isPro: sub !== null,
    coins,
    subscription: sub
      ? { plan: sub.plan, currentPeriodEnd: sub.currentPeriodEnd.toISOString() }
      : null,
  });
}
