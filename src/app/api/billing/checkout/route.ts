import { getViewer } from "@/server/entitlements";
import {
  activatePlan,
  createOrder,
  createSubscription,
  hasSubscriptionPlan,
  isValidPlan,
  planById,
} from "@/server/billing";
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

  if (!config.razorpay.enabled) {
    return fail(503, "Payments are not configured yet.");
  }

  const user = await store.users.findById(viewer.userId);
  const prefill = { name: user?.name ?? "", email: user?.email ?? "", contact: user?.phone ?? "" };

  // Preferred — recurring Razorpay Subscription against the dashboard plan id.
  if (hasSubscriptionPlan(plan)) {
    const sub = await createSubscription(plan, viewer.userId);
    return ok({
      mode: "razorpay_subscription",
      ...sub,
      name: "Prompt Studio",
      description: `${planById(plan).name} plan`,
      prefill,
    });
  }

  // Fallback — one-time order (used if a plan has no subscription id set).
  const order = await createOrder(plan, viewer.userId, user?.email ?? "", user?.phone ?? null, Date.now());
  return ok({
    mode: "razorpay",
    ...order,
    name: "Prompt Studio",
    description: `${planById(plan).name} plan`,
    prefill,
  });
}
