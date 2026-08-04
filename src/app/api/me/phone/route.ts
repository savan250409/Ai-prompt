import { getViewer } from "@/server/entitlements";
import { store } from "@/server/store";
import { normalizeIndianPhone } from "@/lib/utils";
import { ok, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Set or clear the current user's mobile number (used for Cashfree checkout). */
export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer.userId) return fail(401, "Sign in first.");

  const body = (await req.json().catch(() => null)) as { phone?: string } | null;
  const raw = typeof body?.phone === "string" ? body.phone.trim() : "";

  if (raw === "") {
    await store.users.updatePhone(viewer.userId, null);
    return ok({ phone: null });
  }

  const phone = normalizeIndianPhone(raw);
  if (!phone) return fail(422, "Enter a valid 10-digit Indian mobile number.");
  await store.users.updatePhone(viewer.userId, phone);
  return ok({ phone });
}
