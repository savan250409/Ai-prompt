/**
 * Analytics seam (§10, §12.7). Fire-and-forget client events to /api/analytics.
 * TODO(integration): forward to a real provider (PostHog, GA4, etc.).
 */
export function track(event: string, props?: Record<string, unknown>) {
  try {
    if (typeof window === "undefined") return;
    const body = JSON.stringify({ event, props, ts: Date.now(), path: window.location.pathname });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    }
  } catch {
    /* analytics must never break the app */
  }
}
