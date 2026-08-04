import { getViewer } from "@/server/entitlements";
import {
  chargeSubscription,
  fetchOrderNotes,
  fetchSubscriptionNotes,
  grantTopup,
  isValidPlan,
  isValidTopup,
  verifyPaymentSignature,
  verifySubscriptionSignature,
} from "@/server/billing";
import { ok, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Verify a Razorpay checkout result and fulfil it. The signature proves the
 * payment is genuine; the `notes` (read back from Razorpay) say who + what — so
 * the client can't tamper with the plan or amount. Handles BOTH recurring
 * subscriptions (plans) and one-time orders (top-ups). Idempotent, so a later
 * webhook for the same payment won't double-grant (§7).
 */
export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer.userId) return fail(401, "Sign in first.");

  const body = (await req.json().catch(() => null)) as {
    razorpay_order_id?: string;
    razorpay_subscription_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  } | null;

  const paymentId = body?.razorpay_payment_id;
  const signature = body?.razorpay_signature;
  if (!paymentId || !signature) return fail(400, "Missing payment fields");

  // --- recurring subscription (plan) ---
  const subscriptionId = body?.razorpay_subscription_id;
  if (subscriptionId) {
    if (!verifySubscriptionSignature(subscriptionId, paymentId, signature)) {
      return fail(400, "Payment verification failed");
    }
    const notes = await fetchSubscriptionNotes(subscriptionId);
    if (notes.userId !== viewer.userId) return fail(403, "Subscription does not belong to you");
    if (!isValidPlan(notes.plan)) return fail(400, "Unknown subscription");
    const r = await chargeSubscription(viewer.userId, notes.plan, subscriptionId, paymentId, new Date());
    return ok({ ok: true, kind: "subscription", coins: r.coins });
  }

  // --- one-time order (top-up) ---
  const orderId = body?.razorpay_order_id;
  if (orderId) {
    if (!verifyPaymentSignature(orderId, paymentId, signature)) {
      return fail(400, "Payment verification failed");
    }
    const notes = await fetchOrderNotes(orderId);
    if (notes.userId !== viewer.userId) return fail(403, "Order does not belong to you");
    if (isValidTopup(notes.topup)) {
      const r = await grantTopup(viewer.userId, notes.topup, orderId);
      return ok({ ok: true, kind: "topup", coins: r.coins });
    }
    return fail(400, "Unknown order");
  }

  return fail(400, "Missing order or subscription id");
}
