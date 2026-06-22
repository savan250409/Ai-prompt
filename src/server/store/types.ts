/**
 * Web-data store interfaces — the app-owned data (users, coins, unlocks,
 * favorites, subscriptions, generations). Two implementations sit behind this:
 * Prisma/MySQL (when DATABASE_URL is set) and an in-memory store (so every flow
 * runs locally on the mock catalog before any keys are set — §1).
 *
 * Grows by milestone: M3 users + entitlement reads; M4 unlocks; M5 coins +
 * subscriptions + favorites; M6 generations.
 */
import type { GenerationKind, GenerationStatus, ItemType } from "@/lib/types";

export interface StoredUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  phone: string | null;
  passwordHash: string | null;
  createdAt: Date;
}

export interface UserStore {
  findByEmail(email: string): Promise<StoredUser | null>;
  findById(id: string): Promise<StoredUser | null>;
  create(data: {
    email: string;
    name?: string | null;
    passwordHash?: string | null;
    image?: string | null;
  }): Promise<StoredUser>;
  /** Find-or-create by email for OAuth sign-in. */
  upsertOAuth(data: { email: string; name?: string | null; image?: string | null }): Promise<StoredUser>;
  /** Set/clear the user's mobile number (null clears it). */
  updatePhone(userId: string, phone: string | null): Promise<void>;
}

export type CoinReason =
  | "subscription_grant"
  | "generation_video"
  | "generation_image"
  | "filter"
  | "tool"
  | "refund"
  | "admin";

export interface CoinTxn {
  delta: number;
  reason: CoinReason;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: Date;
}

export interface CoinStore {
  /** Ledger balance = SUM(delta). */
  balance(userId: string): Promise<number>;
  /** Recent ledger entries, newest first. */
  recent(userId: string, limit?: number): Promise<CoinTxn[]>;
  /** Append a ledger entry; returns the new balance. */
  record(entry: {
    userId: string;
    delta: number;
    reason: CoinReason;
    referenceType?: string | null;
    referenceId?: string | null;
  }): Promise<number>;
  /**
   * Atomically spend `amount` (requires balance >= amount). Returns the new
   * balance, or null if insufficient. Spend must be atomic (§1.4).
   */
  spend(entry: {
    userId: string;
    amount: number;
    reason: CoinReason;
    referenceType?: string | null;
    referenceId?: string | null;
  }): Promise<number | null>;
}

export type SubPlan = "weekly" | "monthly" | "yearly";

export interface StoredSubscription {
  id: string;
  userId: string;
  plan: SubPlan;
  status: "active" | "cancelled" | "expired";
  providerSubscriptionId: string | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}

export interface SubscriptionStore {
  activeFor(userId: string): Promise<StoredSubscription | null>;
  isPro(userId: string): Promise<boolean>;
  /** Idempotency guard for webhooks/replays. */
  existsByProviderId(providerSubscriptionId: string): Promise<boolean>;
  activate(data: {
    userId: string;
    plan: SubPlan;
    providerSubscriptionId?: string | null;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<StoredSubscription>;
}

export interface UnlockStore {
  isUnlocked(userId: string, itemType: "video" | "image", itemId: string): Promise<boolean>;
  record(userId: string, itemType: "video" | "image", itemId: string, method: "ad" | "pro"): Promise<void>;
  /** Count of ad-method unlocks since `since` (free-quota accounting, §1.5). */
  adUnlocksSince(userId: string, since: Date): Promise<number>;
  listForUser(userId: string): Promise<{ itemType: "video" | "image"; itemId: string }[]>;
}

export interface StoredFavorite {
  id: string;
  itemType: ItemType;
  itemId: string;
  createdAt: Date;
}

export interface FavoriteStore {
  list(userId: string): Promise<StoredFavorite[]>;
  has(userId: string, itemType: ItemType, itemId: string): Promise<boolean>;
  add(userId: string, itemType: ItemType, itemId: string): Promise<StoredFavorite>;
  remove(userId: string, itemType: ItemType, itemId: string): Promise<void>;
}

export interface StoredGeneration {
  id: string;
  userId: string;
  kind: GenerationKind;
  status: GenerationStatus;
  sourceItemType: string | null;
  sourceItemId: string | null;
  toolKey: string | null;
  params: Record<string, unknown>;
  inputMediaPath: string | null;
  outputMediaPath: string | null;
  providerTaskId: string | null;
  coinsSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerationStore {
  create(data: {
    userId: string;
    kind: GenerationKind;
    sourceItemType?: string | null;
    sourceItemId?: string | null;
    toolKey?: string | null;
    params?: Record<string, unknown>;
    inputMediaPath?: string | null;
    coinsSpent: number;
  }): Promise<StoredGeneration>;
  update(
    id: string,
    patch: Partial<
      Pick<StoredGeneration, "status" | "outputMediaPath" | "providerTaskId">
    >,
  ): Promise<StoredGeneration | null>;
  get(id: string): Promise<StoredGeneration | null>;
  findByProviderTaskId(providerTaskId: string): Promise<StoredGeneration | null>;
  listForUser(userId: string): Promise<StoredGeneration[]>;
}

export interface Store {
  users: UserStore;
  coins: CoinStore;
  subscriptions: SubscriptionStore;
  unlocks: UnlockStore;
  favorites: FavoriteStore;
  generations: GenerationStore;
}
