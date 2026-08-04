import "server-only";
import { auth } from "@/server/auth";
import { store } from "@/server/store";

/**
 * Server-side entitlement checks — the ONLY authority for unlock/Pro/coins
 * (§1, §8). The client is never trusted.
 */

export interface Viewer {
  userId: string | null;
  isPro: boolean;
}

/** Resolve the current viewer from the Auth.js session. */
export async function getViewer(): Promise<Viewer> {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  if (!userId) return { userId: null, isPro: false };
  const isPro = await store.subscriptions.isPro(userId);
  return { userId, isPro };
}

/** Require an authenticated viewer (throws-style returns null userId otherwise). */
export async function requireViewer(): Promise<Viewer & { userId: string }> {
  const v = await getViewer();
  if (!v.userId) throw new UnauthorizedError();
  return v as Viewer & { userId: string };
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "UnauthorizedError";
  }
}

/** Pro => always unlocked; otherwise a recorded prompt_unlocks row (§6). */
export async function isPromptUnlocked(
  itemType: "video" | "image",
  itemId: string,
): Promise<boolean> {
  const viewer = await getViewer();
  if (!viewer.userId) return false;
  if (viewer.isPro) return true;
  return store.unlocks.isUnlocked(viewer.userId, itemType, itemId);
}

/** Start of the current day (UTC) — free-unlock quota window (§1.5). */
export function startOfTodayUTC(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
