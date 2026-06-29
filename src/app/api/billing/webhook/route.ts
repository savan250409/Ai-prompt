import {
  chargeSubscription,
  fetchOrderNotes,
  fetchSubscriptionNotes,
  grantTopup,
  isValidPlan,
  isValidTopup,
  verifyWebhookSignature,
} from "@/server/billing";
import { ok, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Razorpay webhook (§7) — the authoritative backup to the client verify call.
 * Signature = HMAC-SHA256(rawBody, webhookSecret) hex, checked against the
 * x-razorpay-signature header. Resolves the order's `notes` (userId + plan or
 * topup) and fulfils idempotently by order id. Server-to-server only.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) return fail(400, "Invalid signature");

  let event: {
    event?: string;
    payload?: {
      payment?: {
        entity?: { id?: string; order_id?: string; notes?: Record<string, string> | null };
      };
      order?: { entity?: { id?: string; notes?: Record<string, string> | null } };
      subscription?: {
        entity?: { id?: string; notes?: Record<string, string> | null };
      };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return fail(400, "Invalid payload");
  }

  const type = event.event ?? "";

  // --- recurring subscription charge / activation (plans) ---
  if (type.startsWith("subscription.")) {
    const subId = event.payload?.subscription?.entity?.id ?? null;
    const paymentId = event.payload?.payment?.entity?.id ?? null;
    let notes = event.payload?.subscription?.entity?.notes ?? {};
    if (subId && !notes?.userId) {
      try {
        notes = await fetchSubscriptionNotes(subId);
      } catch {
        /* leave notes as-is */
      }
    }
    const userId = notes?.userId;
    // A real charge has a payment id; "charged" is the one that grants coins.
    if (userId && subId && paymentId && isValidPlan(notes.plan)) {
      await chargeSubscription(userId, notes.plan, subId, paymentId, new Date());
    }
    return ok({ received: true });
  }

  // --- one-time order paid (top-ups) ---
  const isPaid = type === "payment.captured" || type === "order.paid";
  if (isPaid) {
    const orderId =
      event.payload?.order?.entity?.id ?? event.payload?.payment?.entity?.order_id ?? null;
    let notes =
      event.payload?.order?.entity?.notes ?? event.payload?.payment?.entity?.notes ?? {};
    if (orderId && !notes?.userId) {
      try {
        notes = await fetchOrderNotes(orderId);
      } catch {
        /* leave notes as-is */
      }
    }
    const userId = notes?.userId;
    if (userId && orderId && isValidTopup(notes.topup)) {
      await grantTopup(userId, notes.topup, orderId);
    }
  }

  return ok({ received: true });
}
