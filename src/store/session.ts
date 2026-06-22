/**
 * Light client state — §2. Server truth lives in /api/me (via TanStack Query);
 * this mirror gives instant access to Pro/coins/unlock and supports optimistic
 * updates (coin roll after a spend, instant unlock reveal). Never the source of
 * truth for entitlement — the server always re-checks (§1).
 */
import { create } from "zustand";
import type { Me } from "@/lib/types";

function unlockKey(itemType: string, itemId: string) {
  return `${itemType}:${itemId}`;
}

interface SessionState {
  me: Me | null;
  hydrated: boolean;
  unlocked: Set<string>;

  setMe: (me: Me) => void;
  reset: () => void;

  // optimistic helpers (server remains authoritative)
  setCoins: (coins: number) => void;
  setPhone: (phone: string | null) => void;
  spendCoinsOptimistic: (amount: number) => void;
  markUnlocked: (itemType: string, itemId: string) => void;
  isUnlocked: (itemType: string, itemId: string) => boolean;
  decFreeUnlocks: () => void;
}

export const useSession = create<SessionState>((set, get) => ({
  me: null,
  hydrated: false,
  unlocked: new Set<string>(),

  setMe: (me) =>
    set(() => ({
      me,
      hydrated: true,
      unlocked: new Set<string>(),
    })),

  reset: () => set({ me: null, hydrated: true, unlocked: new Set() }),

  setCoins: (coins) =>
    set((s) => (s.me ? { me: { ...s.me, coins } } : {})),

  setPhone: (phone) =>
    set((s) => (s.me?.user ? { me: { ...s.me, user: { ...s.me.user, phone } } } : {})),

  spendCoinsOptimistic: (amount) =>
    set((s) => (s.me ? { me: { ...s.me, coins: Math.max(0, s.me.coins - amount) } } : {})),

  markUnlocked: (itemType, itemId) =>
    set((s) => {
      const next = new Set(s.unlocked);
      next.add(unlockKey(itemType, itemId));
      return { unlocked: next };
    }),

  isUnlocked: (itemType, itemId) => get().unlocked.has(unlockKey(itemType, itemId)),

  decFreeUnlocks: () =>
    set((s) =>
      s.me ? { me: { ...s.me, freeUnlocksRemaining: Math.max(0, s.me.freeUnlocksRemaining - 1) } } : {},
    ),
}));

// Convenience selectors
export const selectIsPro = (s: SessionState) => s.me?.isPro ?? false;
export const selectCoins = (s: SessionState) => s.me?.coins ?? 0;
export const selectAuthed = (s: SessionState) => s.me?.authenticated ?? false;
