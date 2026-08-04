import crypto from "node:crypto";
import { config } from "@/lib/config";
import { store } from "@/server/store";
import { ok, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Runware async webhook (§7a) — signature-verified against the RAW body; updates
 * the matching generation by taskUUID (refunds coins on failure). Optional —
 * the client also polls /api/generations/:id, so this is defense in depth.
 */
function verify(raw: string, signature: string): boolean {
  if (!config.runware.webhookSecret || !signature) return false;
  const expected = crypto
    .createHmac("sha256", config.runware.webhookSecret)
    .update(raw)
    .digest("hex");
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signature, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

export async function POST(req: Request) {
  const raw = await req.text();
  const signature =
    req.headers.get("x-runware-signature") ?? req.headers.get("x-webhook-signature") ?? "";
  if (!verify(raw, signature)) return fail(400, "Invalid signature");

  let payload: { data?: unknown } | unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return fail(400, "Invalid payload");
  }

  const dataField = (payload as { data?: unknown }).data;
  const item = (Array.isArray(dataField) ? dataField[0] : (dataField ?? payload)) as Record<
    string,
    unknown
  >;
  const taskUUID = str(item.taskUUID);
  const url = str(item.videoURL) ?? str(item.imageURL) ?? str(item.outputURL);
  const status = str(item.status);

  if (taskUUID) {
    const gen = await store.generations.findByProviderTaskId(taskUUID);
    if (gen && gen.status === "processing") {
      if (url) {
        await store.generations.update(gen.id, { status: "done", outputMediaPath: url });
      } else if (status === "error" || status === "failed") {
        await store.coins.record({
          userId: gen.userId,
          delta: gen.coinsSpent,
          reason: "refund",
          referenceType: "generation",
          referenceId: gen.id,
        });
        await store.generations.update(gen.id, { status: "failed" });
      }
    }
  }

  return ok({ received: true });
}
