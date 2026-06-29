import "server-only";
import { getPrisma } from "@/lib/prisma";
import type {
  CoinStore,
  FavoriteStore,
  GenerationStore,
  Store,
  StoredGeneration,
  StoredSubscription,
  StoredUser,
  SubscriptionStore,
  UnlockStore,
  UserStore,
} from "./types";
import type { GenerationKind, GenerationStatus, ItemType } from "@/lib/types";

/** Prisma/MySQL store (when DATABASE_URL is set). */

const mapUser = (u: {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  phone: string | null;
  passwordHash: string | null;
  createdAt: Date;
}): StoredUser => ({
  id: u.id,
  email: u.email,
  name: u.name,
  image: u.image,
  phone: u.phone,
  passwordHash: u.passwordHash,
  createdAt: u.createdAt,
});

const users: UserStore = {
  async findByEmail(email) {
    const u = await getPrisma().user.findUnique({ where: { email: email.trim().toLowerCase() } });
    return u ? mapUser(u) : null;
  },
  async findById(id) {
    const u = await getPrisma().user.findUnique({ where: { id } });
    return u ? mapUser(u) : null;
  },
  async create({ email, name = null, passwordHash = null, image = null }) {
    const u = await getPrisma().user.create({
      data: { email: email.trim().toLowerCase(), name, passwordHash, image },
    });
    return mapUser(u);
  },
  async upsertOAuth({ email, name = null, image = null }) {
    const e = email.trim().toLowerCase();
    const u = await getPrisma().user.upsert({
      where: { email: e },
      update: {},
      create: { email: e, name, image },
    });
    return mapUser(u);
  },
  async updatePhone(userId, phone) {
    await getPrisma().user.update({ where: { id: userId }, data: { phone } });
  },
};

const coins: CoinStore = {
  async balance(userId) {
    const agg = await getPrisma().coinTransaction.aggregate({
      where: { userId },
      _sum: { delta: true },
    });
    return agg._sum.delta ?? 0;
  },
  async recent(userId, limit = 20) {
    const rows = await getPrisma().coinTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map((r) => ({
      delta: r.delta,
      reason: r.reason,
      referenceType: r.referenceType,
      referenceId: r.referenceId,
      createdAt: r.createdAt,
    }));
  },
  async existsByReference(referenceType, referenceId) {
    const t = await getPrisma().coinTransaction.findFirst({
      where: { referenceType, referenceId },
    });
    return t !== null;
  },
  async record({ userId, delta, reason, referenceType = null, referenceId = null }) {
    await getPrisma().coinTransaction.create({ data: { userId, delta, reason, referenceType, referenceId } });
    return coins.balance(userId);
  },
  async spend({ userId, amount, reason, referenceType = null, referenceId = null }) {
    // Interactive transaction: re-check balance, then append the debit.
    // TODO(M5 hardening): use SELECT ... FOR UPDATE / Serializable isolation to
    // fully prevent concurrent double-spend under load.
    return getPrisma().$transaction(async (tx) => {
      const agg = await tx.coinTransaction.aggregate({ where: { userId }, _sum: { delta: true } });
      const bal = agg._sum.delta ?? 0;
      if (bal < amount) return null;
      await tx.coinTransaction.create({
        data: { userId, delta: -amount, reason, referenceType, referenceId },
      });
      return bal - amount;
    });
  },
};

const subscriptions: SubscriptionStore = {
  async activeFor(userId) {
    const s = await getPrisma().subscription.findFirst({
      // A cancelled sub keeps Pro until the paid period ends.
      where: {
        userId,
        status: { in: ["active", "cancelled"] },
        currentPeriodEnd: { gt: new Date() },
      },
      orderBy: { currentPeriodEnd: "desc" },
    });
    return s
      ? ({
          id: s.id,
          userId: s.userId,
          plan: s.plan,
          status: s.status,
          providerSubscriptionId: s.providerSubscriptionId,
          currentPeriodStart: s.currentPeriodStart,
          currentPeriodEnd: s.currentPeriodEnd,
        } as StoredSubscription)
      : null;
  },
  async isPro(userId) {
    return (await subscriptions.activeFor(userId)) !== null;
  },
  async existsByProviderId(providerSubscriptionId) {
    const s = await getPrisma().subscription.findFirst({ where: { providerSubscriptionId } });
    return s !== null;
  },
  async cancel(userId) {
    await getPrisma().subscription.updateMany({
      where: { userId, status: "active", currentPeriodEnd: { gt: new Date() } },
      data: { status: "cancelled" },
    });
    return subscriptions.activeFor(userId);
  },
  async activate({ userId, plan, providerSubscriptionId = null, periodStart, periodEnd }) {
    return getPrisma().$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: { userId, status: { in: ["active", "cancelled"] } },
        data: { status: "expired" },
      });
      const s = await tx.subscription.create({
        data: {
          userId,
          plan,
          status: "active",
          providerSubscriptionId,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      });
      return {
        id: s.id,
        userId: s.userId,
        plan: s.plan,
        status: s.status,
        providerSubscriptionId: s.providerSubscriptionId,
        currentPeriodStart: s.currentPeriodStart,
        currentPeriodEnd: s.currentPeriodEnd,
      } as StoredSubscription;
    });
  },
  async markCharged({ userId, plan, providerSubscriptionId, periodEnd }) {
    const existing = await getPrisma().subscription.findFirst({
      where: { providerSubscriptionId },
    });
    const toDto = (s: {
      id: string;
      userId: string;
      plan: string;
      status: string;
      providerSubscriptionId: string | null;
      currentPeriodStart: Date;
      currentPeriodEnd: Date;
    }) => s as unknown as StoredSubscription;

    if (existing) {
      const s = await getPrisma().subscription.update({
        where: { id: existing.id },
        data: { status: "active", plan, currentPeriodEnd: periodEnd },
      });
      return toDto(s);
    }
    return getPrisma().$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: { userId, status: { in: ["active", "cancelled"] } },
        data: { status: "expired" },
      });
      const s = await tx.subscription.create({
        data: {
          userId,
          plan,
          status: "active",
          providerSubscriptionId,
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
        },
      });
      return toDto(s);
    });
  },
};

const unlocks: UnlockStore = {
  async isUnlocked(userId, itemType, itemId) {
    const u = await getPrisma().promptUnlock.findFirst({ where: { userId, itemType, itemId } });
    return u !== null;
  },
  async record(userId, itemType, itemId, method) {
    await getPrisma().promptUnlock.upsert({
      where: { userId_itemType_itemId: { userId, itemType, itemId } },
      update: {},
      create: { userId, itemType, itemId, method },
    });
  },
  async adUnlocksSince(userId, since) {
    return getPrisma().promptUnlock.count({
      where: { userId, method: "ad", createdAt: { gte: since } },
    });
  },
  async listForUser(userId) {
    const rows = await getPrisma().promptUnlock.findMany({
      where: { userId },
      select: { itemType: true, itemId: true },
    });
    return rows.map((r) => ({ itemType: r.itemType as "video" | "image", itemId: r.itemId }));
  },
};

const favorites: FavoriteStore = {
  async list(userId) {
    const rows = await getPrisma().favorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((f) => ({
      id: f.id,
      itemType: f.itemType as ItemType,
      itemId: f.itemId,
      createdAt: f.createdAt,
    }));
  },
  async has(userId, itemType, itemId) {
    const f = await getPrisma().favorite.findFirst({ where: { userId, itemType, itemId } });
    return f !== null;
  },
  async add(userId, itemType, itemId) {
    const f = await getPrisma().favorite.upsert({
      where: { userId_itemType_itemId: { userId, itemType, itemId } },
      update: {},
      create: { userId, itemType, itemId },
    });
    return { id: f.id, itemType: f.itemType as ItemType, itemId: f.itemId, createdAt: f.createdAt };
  },
  async remove(userId, itemType, itemId) {
    await getPrisma().favorite.deleteMany({ where: { userId, itemType, itemId } });
  },
};

const mapGen = (g: {
  id: string;
  userId: string;
  kind: string;
  status: string;
  sourceItemType: string | null;
  sourceItemId: string | null;
  toolKey: string | null;
  params: unknown;
  inputMediaPath: string | null;
  outputMediaPath: string | null;
  providerTaskId: string | null;
  coinsSpent: number;
  createdAt: Date;
  updatedAt: Date;
}): StoredGeneration => ({
  id: g.id,
  userId: g.userId,
  kind: g.kind as GenerationKind,
  status: g.status as GenerationStatus,
  sourceItemType: g.sourceItemType,
  sourceItemId: g.sourceItemId,
  toolKey: g.toolKey,
  params: (g.params as Record<string, unknown>) ?? {},
  inputMediaPath: g.inputMediaPath,
  outputMediaPath: g.outputMediaPath,
  providerTaskId: g.providerTaskId,
  coinsSpent: g.coinsSpent,
  createdAt: g.createdAt,
  updatedAt: g.updatedAt,
});

const generations: GenerationStore = {
  async create(d) {
    const g = await getPrisma().generation.create({
      data: {
        userId: d.userId,
        kind: d.kind,
        sourceItemType: d.sourceItemType ?? null,
        sourceItemId: d.sourceItemId ?? null,
        toolKey: d.toolKey ?? null,
        params: (d.params ?? {}) as object,
        inputMediaPath: d.inputMediaPath ?? null,
        coinsSpent: d.coinsSpent,
        status: "queued",
      },
    });
    return mapGen(g);
  },
  async update(id, patch) {
    const g = await getPrisma().generation.update({ where: { id }, data: patch }).catch(() => null);
    return g ? mapGen(g) : null;
  },
  async get(id) {
    const g = await getPrisma().generation.findUnique({ where: { id } });
    return g ? mapGen(g) : null;
  },
  async findByProviderTaskId(providerTaskId) {
    const g = await getPrisma().generation.findFirst({ where: { providerTaskId } });
    return g ? mapGen(g) : null;
  },
  async listForUser(userId) {
    const rows = await getPrisma().generation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapGen);
  },
  async countDoneToolSince(userId, toolKey, since) {
    return getPrisma().generation.count({
      where: { userId, toolKey, status: "done", createdAt: { gte: since } },
    });
  },
};

export const prismaStore: Store = {
  users,
  coins,
  subscriptions,
  unlocks,
  favorites,
  generations,
};
