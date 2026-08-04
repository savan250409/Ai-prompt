import "server-only";
import type {
  CoinStore,
  CoinTxn,
  FavoriteStore,
  GenerationStore,
  Store,
  StoredFavorite,
  StoredGeneration,
  StoredSubscription,
  StoredUser,
  SubscriptionStore,
  UnlockStore,
  UserStore,
} from "./types";

/**
 * In-memory store (mock mode). Single Node process => operations are atomic.
 * Data resets on restart — fine for local demos of every flow before a DB is
 * configured (§1). Persisted on globalThis to survive dev HMR.
 */
interface MemoryData {
  users: Map<string, StoredUser>;
  emailIndex: Map<string, string>;
  ledger: ({ userId: string } & CoinTxn)[];
  subscriptions: StoredSubscription[];
  unlocks: { userId: string; itemType: "video" | "image"; itemId: string; method: "ad" | "pro"; createdAt: Date }[];
  favorites: (StoredFavorite & { userId: string })[];
  generations: Map<string, StoredGeneration>;
}

const g = globalThis as unknown as { __memStore?: MemoryData };
const data: MemoryData =
  g.__memStore ??
  (g.__memStore = {
    users: new Map(),
    emailIndex: new Map(),
    ledger: [],
    subscriptions: [],
    unlocks: [],
    favorites: [],
    generations: new Map(),
  });

const id = () => crypto.randomUUID();
const normEmail = (e: string) => e.trim().toLowerCase();

const users: UserStore = {
  async findByEmail(email) {
    const uid = data.emailIndex.get(normEmail(email));
    return uid ? (data.users.get(uid) ?? null) : null;
  },
  async findById(uid) {
    return data.users.get(uid) ?? null;
  },
  async create({ email, name = null, passwordHash = null, image = null }) {
    const e = normEmail(email);
    const user: StoredUser = {
      id: id(),
      email: e,
      name,
      image,
      phone: null,
      passwordHash,
      createdAt: new Date(),
    };
    data.users.set(user.id, user);
    data.emailIndex.set(e, user.id);
    return user;
  },
  async updatePhone(userId, phone) {
    const user = data.users.get(userId);
    if (user) user.phone = phone;
  },
  async upsertOAuth({ email, name = null, image = null }) {
    const existing = await users.findByEmail(email);
    if (existing) {
      if (!existing.name && name) existing.name = name;
      if (!existing.image && image) existing.image = image;
      return existing;
    }
    return users.create({ email, name, image });
  },
};

const coins: CoinStore = {
  async balance(userId) {
    return data.ledger.reduce((sum, e) => (e.userId === userId ? sum + e.delta : sum), 0);
  },
  async recent(userId, limit = 20) {
    return data.ledger
      .filter((e) => e.userId === userId)
      .slice()
      .reverse()
      .slice(0, limit)
      .map(({ userId: _u, ...t }) => t);
  },
  async existsByReference(referenceType, referenceId) {
    return data.ledger.some(
      (e) => e.referenceType === referenceType && e.referenceId === referenceId,
    );
  },
  async record({ userId, delta, reason, referenceType = null, referenceId = null }) {
    data.ledger.push({ userId, delta, reason, referenceType, referenceId, createdAt: new Date() });
    return coins.balance(userId);
  },
  async spend({ userId, amount, reason, referenceType = null, referenceId = null }) {
    const bal = await coins.balance(userId);
    if (bal < amount) return null;
    data.ledger.push({
      userId,
      delta: -amount,
      reason,
      referenceType,
      referenceId,
      createdAt: new Date(),
    });
    return bal - amount;
  },
};

const subscriptions: SubscriptionStore = {
  async activeFor(userId) {
    const now = Date.now();
    // A cancelled sub keeps Pro until the paid period ends — so both "active"
    // and not-yet-expired "cancelled" count as currently subscribed.
    return (
      data.subscriptions.find(
        (s) =>
          s.userId === userId &&
          (s.status === "active" || s.status === "cancelled") &&
          s.currentPeriodEnd.getTime() > now,
      ) ?? null
    );
  },
  async isPro(userId) {
    return (await subscriptions.activeFor(userId)) !== null;
  },
  async existsByProviderId(providerSubscriptionId) {
    return data.subscriptions.some((s) => s.providerSubscriptionId === providerSubscriptionId);
  },
  async cancel(userId) {
    const now = Date.now();
    for (const s of data.subscriptions) {
      if (s.userId === userId && s.status === "active" && s.currentPeriodEnd.getTime() > now) {
        s.status = "cancelled";
      }
    }
    return subscriptions.activeFor(userId);
  },
  async markCharged({ userId, plan, providerSubscriptionId, periodEnd }) {
    const existing = data.subscriptions.find(
      (s) => s.providerSubscriptionId === providerSubscriptionId,
    );
    if (existing) {
      existing.status = "active";
      existing.plan = plan;
      existing.currentPeriodEnd = periodEnd;
      return existing;
    }
    for (const s of data.subscriptions) {
      if (s.userId === userId && (s.status === "active" || s.status === "cancelled")) {
        s.status = "expired";
      }
    }
    const sub: StoredSubscription = {
      id: id(),
      userId,
      plan,
      status: "active",
      providerSubscriptionId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
    };
    data.subscriptions.push(sub);
    return sub;
  },
  async activate({ userId, plan, providerSubscriptionId = null, periodStart, periodEnd }) {
    // expire any prior active/cancelled sub for this user
    for (const s of data.subscriptions) {
      if (s.userId === userId && (s.status === "active" || s.status === "cancelled")) {
        s.status = "expired";
      }
    }
    const sub: StoredSubscription = {
      id: id(),
      userId,
      plan,
      status: "active",
      providerSubscriptionId,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    };
    data.subscriptions.push(sub);
    return sub;
  },
};

const unlocks: UnlockStore = {
  async isUnlocked(userId, itemType, itemId) {
    return data.unlocks.some(
      (u) => u.userId === userId && u.itemType === itemType && u.itemId === itemId,
    );
  },
  async record(userId, itemType, itemId, method) {
    if (await unlocks.isUnlocked(userId, itemType, itemId)) return;
    data.unlocks.push({ userId, itemType, itemId, method, createdAt: new Date() });
  },
  async adUnlocksSince(userId, since) {
    return data.unlocks.filter(
      (u) => u.userId === userId && u.method === "ad" && u.createdAt >= since,
    ).length;
  },
  async listForUser(userId) {
    return data.unlocks
      .filter((u) => u.userId === userId)
      .map((u) => ({ itemType: u.itemType, itemId: u.itemId }));
  },
};

const favorites: FavoriteStore = {
  async list(userId) {
    return data.favorites
      .filter((f) => f.userId === userId)
      .map(({ userId: _u, ...f }) => f)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },
  async has(userId, itemType, itemId) {
    return data.favorites.some(
      (f) => f.userId === userId && f.itemType === itemType && f.itemId === itemId,
    );
  },
  async add(userId, itemType, itemId) {
    const existing = data.favorites.find(
      (f) => f.userId === userId && f.itemType === itemType && f.itemId === itemId,
    );
    if (existing) {
      const { userId: _u, ...rest } = existing;
      return rest;
    }
    const fav = { id: id(), userId, itemType, itemId, createdAt: new Date() };
    data.favorites.push(fav);
    const { userId: _u, ...rest } = fav;
    return rest;
  },
  async remove(userId, itemType, itemId) {
    data.favorites = data.favorites.filter(
      (f) => !(f.userId === userId && f.itemType === itemType && f.itemId === itemId),
    );
  },
};

const generations: GenerationStore = {
  async create(d) {
    const now = new Date();
    const gen: StoredGeneration = {
      id: id(),
      userId: d.userId,
      kind: d.kind,
      status: "queued",
      sourceItemType: d.sourceItemType ?? null,
      sourceItemId: d.sourceItemId ?? null,
      toolKey: d.toolKey ?? null,
      params: d.params ?? {},
      inputMediaPath: d.inputMediaPath ?? null,
      outputMediaPath: null,
      providerTaskId: null,
      coinsSpent: d.coinsSpent,
      createdAt: now,
      updatedAt: now,
    };
    data.generations.set(gen.id, gen);
    return gen;
  },
  async update(genId, patch) {
    const gen = data.generations.get(genId);
    if (!gen) return null;
    Object.assign(gen, patch, { updatedAt: new Date() });
    return gen;
  },
  async get(genId) {
    return data.generations.get(genId) ?? null;
  },
  async findByProviderTaskId(providerTaskId) {
    for (const gen of data.generations.values()) {
      if (gen.providerTaskId === providerTaskId) return gen;
    }
    return null;
  },
  async listForUser(userId) {
    return [...data.generations.values()]
      .filter((g) => g.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },
  async countDoneToolSince(userId, toolKey, since) {
    return [...data.generations.values()].filter(
      (g) =>
        g.userId === userId &&
        g.toolKey === toolKey &&
        g.status === "done" &&
        g.createdAt >= since,
    ).length;
  },
};

export const memoryStore: Store = {
  users,
  coins,
  subscriptions,
  unlocks,
  favorites,
  generations,
};
