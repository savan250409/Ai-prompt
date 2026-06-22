import { activatePlan, isValidPlan, verifyWebhookSignature } from "@/server/billing";
import { ok, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Cashfree webhook (§7, §8). Signature = base64(HMAC-SHA256(timestamp + rawBody,
 * secretKey)), verified against the x-webhook-signature header. Activates the
 * plan + grants coins idempotently (by order_id). Server-to-server only.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-webhook-signature") ?? "";
  const timestamp = req.headers.get("x-webhook-timestamp") ?? "";

  if (!verifyWebhookSignature(raw, timestamp, signature)) {
    return fail(400, "Invalid signature");
  }

  let event: {
    type?: string;
    data?: {
      order?: { order_id?: string; order_tags?: Record<string, string> | null };
      payment?: { payment_status?: string };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return fail(400, "Invalid payload");
  }

  const isSuccess =
    event.type === "PAYMENT_SUCCESS_WEBHOOK" ||
    event.data?.payment?.payment_status === "SUCCESS";

  if (isSuccess) {
    const order = event.data?.order;
    const tags = order?.order_tags ?? {};
    const userId = tags.userId;
    const plan = tags.plan;
    const providerId = order?.order_id ?? null;
    if (userId && isValidPlan(plan)) {
      await activatePlan(userId, plan, providerId, new Date());
    }
  }

  return ok({ received: true });
}
