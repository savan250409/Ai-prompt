import { getViewer } from "@/server/entitlements";
import { createTopupOrder, grantTopup, isValidTopup, topupById } from "@/server/billing";
import { store } from "@/server/store";
import { config } from "@/lib/config";
import { ok, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Buy a one-time coin top-up (§7). Dev test-mode grants coins immediately. */
export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer.userId) return fail(401, "Sign in to buy coins.");

  const body = (await req.json().catch(() => null)) as { topup?: string } | null;
  if (!isValidTopup(body?.topup)) return fail(400, "Invalid top-up");
  const topup = body.topup;

  // Dev test-mode — simulate a successful purchase locally (never in prod, §1.6).
  if (config.devBillingTestMode) {
    const result = await grantTopup(viewer.userId, topup, `test_topup_${topup}_${Date.now()}`);
    return ok({ mode: "test", coins: result.coins });
  }

  if (!config.razorpay.enabled) {
    return fail(503, "Payments are not configured yet.");
  }

  const user = await store.users.findById(viewer.userId);
  const t = topupById(topup);
  const order = await createTopupOrder(topup, viewer.userId, user?.email ?? "", user?.phone ?? null, Date.now());
  return ok({
    mode: "razorpay",
    ...order,
    name: "Prompt Studio",
    description: `${t.coins} coins (${t.name})`,
    prefill: { name: user?.name ?? "", email: user?.email ?? "", contact: user?.phone ?? "" },
  });
}
