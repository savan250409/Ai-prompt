import { getViewer } from "@/server/entitlements";
import { ok, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Collect feedback. Logged server-side; wire to a real channel in production. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    rating?: number;
    message?: string;
  } | null;

  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) return fail(400, "Please include a message.");
  const rating = typeof body?.rating === "number" ? Math.max(0, Math.min(5, body.rating)) : 0;

  const viewer = await getViewer();
  // TODO(integration): forward to email/Slack/Linear or persist to a table.
  console.info("[feedback]", { userId: viewer.userId, rating, message: message.slice(0, 2000) });

  return ok({ received: true });
}
