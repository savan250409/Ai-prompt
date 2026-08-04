import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Receive client analytics events. Logged; wire to a real provider later. */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (process.env.NODE_ENV !== "production") {
      console.debug("[analytics]", body?.event, body?.props ?? {});
    }
    // TODO(integration): forward to PostHog/GA4/etc.
  } catch {
    /* ignore malformed beacons */
  }
  return ok({ ok: true });
}
