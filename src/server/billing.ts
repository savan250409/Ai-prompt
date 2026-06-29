import "server-only";
import crypto from "node:crypto";
import { config, PLANS, TOPUPS, type PlanId, type TopupId } from "@/lib/config";
import { store } from "@/server/store";

/**
 * Billing — Razorpay Payments (INR). The server creates an order; the client
 * opens Razorpay Checkout with the order id; on success the client posts the
 * payment id + signature back, which the server verifies before activating the
 * plan / granting coins (a signed webhook is the authoritative backup). Until
 * keys are set, the routes fall back to a flagged dev test-mode (off in prod).
 * (§1.6, §4, §7)
 */

const PERIOD_DAYS: Record<PlanId, number> = { weekly: 7, monthly: 30, yearly: 365 };
// Number of billing cycles a Razorpay subscription runs before it completes.
const TOTAL_COUNT: Record<PlanId, number> = { weekly: 52, monthly: 12, yearly: 5 };

export function planById(id: PlanId) {
  const p = PLANS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown plan: ${id}`);
  return p;
}

export function isValidPlan(id: unknown): id is PlanId {
  return id === "weekly" || id === "monthly" || id === "yearly";
}

export function topupById(id: TopupId) {
  const t = TOPUPS.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown top-up: ${id}`);
  return t;
}

export function isValidTopup(id: unknown): id is TopupId {
  return typeof id === "string" && TOPUPS.some((t) => t.id === id);
}

/** What the client needs to open the Razorpay checkout for an order. */
export interface RazorpayOrderView {
  orderId: string;
  amount: number; // paise
  currency: string;
  keyId: string; // public key id
}

interface RazorpayOrder {
  id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  notes?: Record<string, string> | null;
  error?: { description?: string };
}

async function razorpayFetch(path: string, init?: RequestInit): Promise<RazorpayOrder> {
  const auth = Buffer.from(
    `${config.razorpay.keyId}:${config.razorpay.keySecret}`,
  ).toString("base64");
  const res = await fetch(`${config.razorpay.apiBase}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as RazorpayOrder;
  if (!res.ok) throw new Error(json.error?.description ?? `Razorpay error ${res.status}`);
  return json;
}

/**
 * Create a Razorpay order. Amount is in MINOR units (paise) = rupees × 100.
 * userId + plan ride along in `notes` so verify/webhook can resolve them.
 */
export async function createOrder(
  plan: PlanId,
  userId: string,
  _email: string,
  _phone: string | null,
  receiptStamp: number,
): Promise<RazorpayOrderView> {
  const p = planById(plan);
  const order = await razorpayFetch("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: p.priceInr * 100,
      currency: "INR",
      receipt: `sub_${userId}_${plan}_${receiptStamp}`.slice(0, 40),
      notes: { userId, plan },
    }),
  });
  if (!order.id) throw new Error("Razorpay did not return an order id");
  return {
    orderId: order.id,
    amount: order.amount ?? p.priceInr * 100,
    currency: order.currency ?? "INR",
    keyId: config.razorpay.keyId,
  };
}

/** Read an order's `notes` (userId + plan/topup) — authoritative, from Razorpay. */
export async function fetchOrderNotes(orderId: string): Promise<Record<string, string>> {
  const order = await razorpayFetch(`/orders/${orderId}`, { method: "GET" });
  return order.notes ?? {};
}

/** True when a plan has a Razorpay subscription plan id configured. */
export function hasSubscriptionPlan(plan: PlanId): boolean {
  return Boolean(config.razorpay.planId[plan]);
}

/** What the client needs to open Razorpay checkout for a subscription. */
export interface RazorpaySubscriptionView {
  subscriptionId: string;
  keyId: string;
}

/**
 * Create a Razorpay subscription against the dashboard plan id. userId + plan
 * ride along in `notes` so verify/webhook can resolve them. Recurring: Razorpay
 * charges each cycle and fires `subscription.charged`.
 */
export async function createSubscription(
  plan: PlanId,
  userId: string,
): Promise<RazorpaySubscriptionView> {
  const planId = config.razorpay.planId[plan];
  if (!planId) throw new Error(`No Razorpay plan id for ${plan}`);
  const sub = await razorpayFetch("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: planId,
      total_count: TOTAL_COUNT[plan],
      customer_notify: 1,
      notes: { userId, plan },
    }),
  });
  if (!sub.id) throw new Error("Razorpay did not return a subscription id");
  return { subscriptionId: sub.id, keyId: config.razorpay.keyId };
}

/** Read a subscription's `notes` (userId + plan) — authoritative, from Razorpay. */
export async function fetchSubscriptionNotes(
  subscriptionId: string,
): Promise<Record<string, string>> {
  const sub = await razorpayFetch(`/subscriptions/${subscriptionId}`, { method: "GET" });
  return sub.notes ?? {};
}

/** Cancel a Razorpay subscription (cancel_at_cycle_end = stop future renewals). */
export async function cancelRazorpaySubscription(subscriptionId: string): Promise<void> {
  await razorpayFetch(`/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ cancel_at_cycle_end: 1 }),
  });
}

/**
 * Record a subscription charge — idempotent per payment id, so each renewal
 * grants coins exactly once and extends the Pro period. Used by both the client
 * verify (first charge) and the webhook (renewals).
 */
export async function chargeSubscription(
  userId: string,
  plan: PlanId,
  subscriptionId: string,
  paymentId: string,
  now: Date,
): Promise<{ charged: boolean; coins: number }> {
  if (await store.coins.existsByReference("subscription_charge", paymentId)) {
    return { charged: false, coins: 0 };
  }
  const periodEnd = new Date(now.getTime() + PERIOD_DAYS[plan] * 24 * 60 * 60 * 1000);
  await store.subscriptions.markCharged({ userId, plan, providerSubscriptionId: subscriptionId, periodEnd });
  const coins = config.planCoins[plan];
  await store.coins.record({
    userId,
    delta: coins,
    reason: "subscription_grant",
    referenceType: "subscription_charge",
    referenceId: paymentId,
  });
  return { charged: true, coins };
}

/**
 * Verify a Razorpay subscription checkout result: HMAC-SHA256(payment_id + "|" +
 * subscription_id, key_secret) hex must equal razorpay_signature. NOTE the order
 * is payment|subscription (subscriptions), unlike order|payment (one-time).
 */
export function verifySubscriptionSignature(
  subscriptionId: string,
  paymentId: string,
  signature: string,
): boolean {
  if (!config.razorpay.keySecret || !subscriptionId || !paymentId || !signature) return false;
  const expected = crypto
    .createHmac("sha256", config.razorpay.keySecret)
    .update(`${paymentId}|${subscriptionId}`)
    .digest("hex");
  return timingSafeEqualStr(expected, signature);
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length || ab.length === 0) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * Verify a Razorpay checkout result: HMAC-SHA256(order_id + "|" + payment_id,
 * key_secret) in hex must equal the razorpay_signature returned to the client.
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  if (!config.razorpay.keySecret || !orderId || !paymentId || !signature) return false;
  const expected = crypto
    .createHmac("sha256", config.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return timingSafeEqualStr(expected, signature);
}

/**
 * Verify a Razorpay webhook: HMAC-SHA256(rawBody, webhookSecret) in hex,
 * compared against the x-razorpay-signature header.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!config.razorpay.webhookSecret || !signature) return false;
  const expected = crypto
    .createHmac("sha256", config.razorpay.webhookSecret)
    .update(rawBody)
    .digest("hex");
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

/**
 * Create a Razorpay order for a coin top-up (one-time, no subscription). userId
 * + topup id ride along in `notes` so verify/webhook can resolve + grant.
 */
export async function createTopupOrder(
  topup: TopupId,
  userId: string,
  _email: string,
  _phone: string | null,
  receiptStamp: number,
): Promise<RazorpayOrderView> {
  const t = topupById(topup);
  const order = await razorpayFetch("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: t.priceInr * 100,
      currency: "INR",
      receipt: `top_${userId}_${topup}_${receiptStamp}`.slice(0, 40),
      notes: { userId, topup },
    }),
  });
  if (!order.id) throw new Error("Razorpay did not return an order id");
  return {
    orderId: order.id,
    amount: order.amount ?? t.priceInr * 100,
    currency: order.currency ?? "INR",
    keyId: config.razorpay.keyId,
  };
}

/**
 * Grant top-up coins — idempotent on the provider reference (order id) so
 * webhook retries don't double-credit. Returns the grant result.
 */
export async function grantTopup(
  userId: string,
  topup: TopupId,
  providerRef: string,
): Promise<{ granted: boolean; coins: number }> {
  const t = topupById(topup);
  if (await store.coins.existsByReference("topup", providerRef)) {
    return { granted: false, coins: 0 };
  }
  await store.coins.record({
    userId,
    delta: t.coins,
    reason: "topup",
    referenceType: "topup",
    referenceId: providerRef,
  });
  return { granted: true, coins: t.coins };
}
