import { getViewer } from "@/server/entitlements";
import { cancelRazorpaySubscription } from "@/server/billing";
import { store } from "@/server/store";
import { ok, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Cancel the current subscription. It stays Pro until the end of the paid
 * period (it just won't renew). For a Razorpay recurring subscription we also
 * cancel it upstream so it stops auto-charging. Server-enforced.
 */
export async function POST() {
  const viewer = await getViewer();
  if (!viewer.userId) return fail(401, "Sign in to manage your plan.");

  const active = await store.subscriptions.activeFor(viewer.userId);
  if (!active) return fail(404, "You don't have an active subscription.");

  // Stop future Razorpay charges (recurring subscriptions start with "sub_").
  if (active.providerSubscriptionId?.startsWith("sub_")) {
    try {
      await cancelRazorpaySubscription(active.providerSubscriptionId);
    } catch {
      /* still cancel locally even if the upstream call fails */
    }
  }

  const sub = await store.subscriptions.cancel(viewer.userId);
  return ok({
    ok: true,
    status: sub?.status ?? "cancelled",
    activeUntil: (sub ?? active).currentPeriodEnd.toISOString(),
  });
}
