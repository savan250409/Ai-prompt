import "server-only";
import crypto from "node:crypto";
import { config, PLANS, type PlanId } from "@/lib/config";
import { store } from "@/server/store";

/**
 * Billing — Cashfree Payments (INR). The server creates an order; the client
 * opens Cashfree Checkout with the returned payment_session_id; a signature-
 * verified webhook activates the plan period and grants coins on each
 * successful payment/renewal (§1.6, §4, §7). Until keys are set, the routes
 * fall back to a clearly-flagged dev test-mode (disabled in production).
 */

const PERIOD_DAYS: Record<PlanId, number> = { weekly: 7, monthly: 30, yearly: 365 };

export function planById(id: PlanId) {
  const p = PLANS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown plan: ${id}`);
  return p;
}

export function isValidPlan(id: unknown): id is PlanId {
  return id === "weekly" || id === "monthly" || id === "yearly";
}

interface CashfreeOrder {
  order_id?: string;
  order_status?: string;
  payment_session_id?: string;
  message?: string;
  order_tags?: Record<string, string> | null;
}

async function cashfreeFetch(path: string, init?: RequestInit): Promise<CashfreeOrder> {
  const res = await fetch(`${config.cashfree.baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-client-id": config.cashfree.appId,
      "x-client-secret": config.cashfree.secretKey,
      "x-api-version": config.cashfree.apiVersion,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as CashfreeOrder;
  if (!res.ok) throw new Error(json.message ?? `Cashfree error ${res.status}`);
  return json;
}

/**
 * Create a Cashfree order for a plan. Amounts are in MAJOR units (rupees), not
 * paise. userId + plan ride along in order_tags so the webhook can resolve them.
 */
export async function createOrder(
  plan: PlanId,
  userId: string,
  email: string,
  phone: string | null,
  receiptStamp: number,
): Promise<{ orderId: string; paymentSessionId: string }> {
  const p = planById(plan);
  const orderId = `sub_${userId}_${plan}_${receiptStamp}`;
  const base = process.env.NEXTAUTH_URL ?? "";
  const order = await cashfreeFetch("/orders", {
    method: "POST",
    body: JSON.stringify({
      order_id: orderId,
      order_amount: p.priceInr,
      order_currency: "INR",
      customer_details: {
        customer_id: userId,
        customer_email: email || "noreply@promptstudio.app",
        // The user's saved number (account page); placeholder only as a fallback.
        customer_phone: phone || config.cashfree.defaultPhone,
      },
      order_tags: { userId, plan },
      order_meta: {
        notify_url: `${base}/api/billing/webhook`,
        return_url: `${base}/account/billing?order_id={order_id}`,
      },
    }),
  });
  if (!order.payment_session_id) throw new Error("Cashfree did not return a payment session");
  return { orderId, paymentSessionId: order.payment_session_id };
}

/** Fetch an order's status (e.g. "PAID") — used as a fallback to the webhook. */
export async function getOrderStatus(orderId: string): Promise<string | null> {
  const order = await cashfreeFetch(`/orders/${orderId}`, { method: "GET" });
  return order.order_status ?? null;
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length || ab.length === 0) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * Verify a Cashfree webhook: base64(HMAC-SHA256(timestamp + rawBody, secretKey))
 * compared against the x-webhook-signature header.
 */
export function verifyWebhookSignature(
  rawBody: string,
  timestamp: string,
  signature: string,
): boolean {
  if (!config.cashfree.secretKey || !signature || !timestamp) return false;
  const expected = crypto
    .createHmac("sha256", config.cashfree.secretKey)
    .update(timestamp + rawBody)
    .digest("base64");
  return timingSafeEqualStr(expected, signature);
}

/**
 * Activate a plan period and grant coins — idempotent on providerSubscriptionId
 * so webhook retries don't double-grant. Returns the grant result.
 */
export async function activatePlan(
  userId: string,
  plan: PlanId,
  providerSubscriptionId: string | null,
  now: Date,
): Promise<{ activated: boolean; coins: number; periodEnd: Date }> {
  if (providerSubscriptionId && (await store.subscriptions.existsByProviderId(providerSubscriptionId))) {
    const active = await store.subscriptions.activeFor(userId);
    return { activated: false, coins: 0, periodEnd: active?.currentPeriodEnd ?? now };
  }

  const periodEnd = new Date(now.getTime() + PERIOD_DAYS[plan] * 24 * 60 * 60 * 1000);
  await store.subscriptions.activate({
    userId,
    plan,
    providerSubscriptionId,
    periodStart: now,
    periodEnd,
  });

  const coins = config.planCoins[plan];
  await store.coins.record({
    userId,
    delta: coins,
    reason: "subscription_grant",
    referenceType: "subscription",
    referenceId: providerSubscriptionId,
  });

  return { activated: true, coins, periodEnd };
}
