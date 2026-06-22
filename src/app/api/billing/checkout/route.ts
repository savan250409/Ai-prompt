import { getViewer } from "@/server/entitlements";
import { activatePlan, createOrder, isValidPlan } from "@/server/billing";
import { store } from "@/server/store";
import { config } from "@/lib/config";
import { ok, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Start a subscription purchase (§7). Dev test-mode activates immediately. */
export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer.userId) return fail(401, "Sign in to subscribe.");

  const body = (await req.json().catch(() => null)) as { plan?: string } | null;
  if (!isValidPlan(body?.plan)) return fail(400, "Invalid plan");
  const plan = body.plan;

  // Dev test-mode — simulate a successful purchase locally (never in prod, §1.6).
  if (config.devBillingTestMode) {
    const result = await activatePlan(viewer.userId, plan, `test_${plan}_${Date.now()}`, new Date());
    return ok({ mode: "test", activated: true, coins: result.coins });
  }

  if (!config.cashfree.enabled) {
    return fail(503, "Payments are not configured yet.");
  }

  // Real mode — create a Cashfree order; the client opens Checkout with the
  // payment_session_id. Activation happens via the signed webhook.
  const user = await store.users.findById(viewer.userId);

  // Cashfree requires a customer phone. If the user hasn't saved one, ask the
  // client to collect it, then it retries checkout.
  if (!user?.phone) {
    return ok({ mode: "need_phone" });
  }

  const { orderId, paymentSessionId } = await createOrder(
    plan,
    viewer.userId,
    user.email,
    user.phone,
    Date.now(),
  );
  return ok({ mode: "cashfree", orderId, paymentSessionId, env: config.cashfree.env });
}
