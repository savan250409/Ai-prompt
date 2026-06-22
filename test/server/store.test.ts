import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { store } from "@/server/store";

const freshUser = () => store.users.create({ email: `u_${randomUUID()}@test.dev` });

describe("coin ledger", () => {
  it("records, spends, and refunds; insufficient spend is a no-op", async () => {
    const u = await freshUser();
    expect(await store.coins.balance(u.id)).toBe(0);
    await store.coins.record({ userId: u.id, delta: 50, reason: "subscription_grant" });
    expect(await store.coins.balance(u.id)).toBe(50);

    expect(await store.coins.spend({ userId: u.id, amount: 10, reason: "generation_image" })).toBe(40);

    const overspend = await store.coins.spend({ userId: u.id, amount: 999, reason: "generation_video" });
    expect(overspend).toBeNull();
    expect(await store.coins.balance(u.id)).toBe(40); // unchanged

    await store.coins.record({ userId: u.id, delta: 10, reason: "refund" });
    expect(await store.coins.balance(u.id)).toBe(50);
  });

  it("isolates balances per user", async () => {
    const a = await freshUser();
    const b = await freshUser();
    await store.coins.record({ userId: a.id, delta: 100, reason: "admin" });
    expect(await store.coins.balance(a.id)).toBe(100);
    expect(await store.coins.balance(b.id)).toBe(0);
  });
});

describe("unlock free-quota", () => {
  it("counts distinct ad-unlocks and is idempotent", async () => {
    const u = await freshUser();
    const since = new Date(Date.now() - 60_000);
    await store.unlocks.record(u.id, "video", "v1", "ad");
    await store.unlocks.record(u.id, "video", "v2", "ad");
    await store.unlocks.record(u.id, "video", "v1", "ad"); // duplicate -> no-op
    expect(await store.unlocks.adUnlocksSince(u.id, since)).toBe(2);
    expect(await store.unlocks.isUnlocked(u.id, "video", "v1")).toBe(true);
    expect(await store.unlocks.isUnlocked(u.id, "image", "v1")).toBe(false);
  });

  it("does not count pro unlocks toward the ad quota", async () => {
    const u = await freshUser();
    const since = new Date(Date.now() - 60_000);
    await store.unlocks.record(u.id, "image", "i1", "pro");
    expect(await store.unlocks.adUnlocksSince(u.id, since)).toBe(0);
    expect(await store.unlocks.isUnlocked(u.id, "image", "i1")).toBe(true);
  });
});

describe("favorites", () => {
  it("adds/has/removes idempotently", async () => {
    const u = await freshUser();
    await store.favorites.add(u.id, "filter", "f1");
    await store.favorites.add(u.id, "filter", "f1"); // idempotent
    expect((await store.favorites.list(u.id)).length).toBe(1);
    expect(await store.favorites.has(u.id, "filter", "f1")).toBe(true);
    await store.favorites.remove(u.id, "filter", "f1");
    expect(await store.favorites.has(u.id, "filter", "f1")).toBe(false);
  });
});

describe("subscriptions", () => {
  it("activate sets Pro; existsByProviderId guards webhook idempotency", async () => {
    const u = await freshUser();
    expect(await store.subscriptions.isPro(u.id)).toBe(false);
    await store.subscriptions.activate({
      userId: u.id,
      plan: "monthly",
      providerSubscriptionId: "prov_1",
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 86_400_000),
    });
    expect(await store.subscriptions.isPro(u.id)).toBe(true);
    expect(await store.subscriptions.existsByProviderId("prov_1")).toBe(true);
    expect(await store.subscriptions.existsByProviderId("prov_x")).toBe(false);
  });

  it("an expired period is not Pro", async () => {
    const u = await freshUser();
    await store.subscriptions.activate({
      userId: u.id,
      plan: "weekly",
      providerSubscriptionId: "prov_exp",
      periodStart: new Date(Date.now() - 100_000),
      periodEnd: new Date(Date.now() - 1_000),
    });
    expect(await store.subscriptions.isPro(u.id)).toBe(false);
  });
});
