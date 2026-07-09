import { describe, it, expect } from "vitest";
import { planState } from "@/components/billing/plan-state";
import type { Me } from "@/lib/types";

const WEEKLY = { id: "weekly" as const, name: "Weekly" };
const MONTHLY = { id: "monthly" as const, name: "Monthly" };
const YEARLY = { id: "yearly" as const, name: "Yearly" };

function me(plan: string | null, planStatus: "active" | "cancelled" | null): Me {
  return {
    authenticated: true,
    user: { id: "u1", name: "A", email: "a@b.c", avatar: null, phone: null },
    isPro: planStatus !== null,
    plan,
    planStatus,
    coins: 0,
    freeUnlocksRemaining: 0,
  };
}

describe("planState — free user (no plan)", () => {
  it("invites you to choose each plan, none disabled or owned", () => {
    for (const p of [WEEKLY, MONTHLY, YEARLY]) {
      const s = planState(me(null, null), p, "monthly");
      expect(s.ctaLabel).toBe(`Choose ${p.name}`);
      expect(s.ctaDisabled).toBe(false);
      expect(s.owned).toBe(false);
    }
  });

  it("spotlights the plan picked in the billing toggle", () => {
    expect(planState(me(null, null), MONTHLY, "monthly").spotlight).toBe(true);
    expect(planState(me(null, null), WEEKLY, "monthly").spotlight).toBe(false);
  });
});

describe("planState — user with an ACTIVE plan (§3)", () => {
  const active = me("monthly", "active");

  it("the owned plan is disabled and labelled 'Current plan'", () => {
    const s = planState(active, MONTHLY, "monthly");
    expect(s.owned).toBe(true);
    expect(s.active).toBe(true);
    expect(s.ctaDisabled).toBe(true);
    expect(s.ctaLabel).toBe("Current plan");
  });

  it("NEVER highlights the owned plan — even when it's the selected one", () => {
    expect(planState(active, MONTHLY, "monthly").spotlight).toBe(false);
  });

  it("every other plan offers ONLY 'Upgrade'", () => {
    for (const p of [WEEKLY, YEARLY]) {
      const s = planState(active, p, "yearly");
      expect(s.ctaLabel).toBe("Upgrade");
      expect(s.ctaDisabled).toBe(false);
      expect(s.owned).toBe(false);
    }
  });
});

// Regression: a cancelled-but-not-expired plan is STILL the user's plan.
// Previously it was treated as purchasable → kept its badge, got the gold
// spotlight, and other cards said "Choose" instead of "Upgrade".
describe("planState — user with a CANCELLED plan (still Pro until expiry)", () => {
  const cancelled = me("monthly", "cancelled");

  it("marks the cancelled plan as owned", () => {
    const s = planState(cancelled, MONTHLY, "monthly");
    expect(s.owned).toBe(true);
    expect(s.cancelled).toBe(true);
  });

  it("NEVER highlights the cancelled plan — even when it's the selected one", () => {
    expect(planState(cancelled, MONTHLY, "monthly").spotlight).toBe(false);
  });

  it("cannot be re-bought while it hasn't expired — disabled 'Current plan'", () => {
    const s = planState(cancelled, MONTHLY, "monthly");
    expect(s.ctaLabel).toBe("Current plan");
    expect(s.ctaDisabled).toBe(true);
  });

  it("every other plan offers ONLY 'Upgrade' (not 'Choose'), still enabled", () => {
    for (const p of [WEEKLY, YEARLY]) {
      const s = planState(cancelled, p, "monthly");
      expect(s.ctaLabel).toBe("Upgrade");
      expect(s.ctaDisabled).toBe(false);
      expect(s.owned).toBe(false);
    }
  });
});

describe("planState — no plan can ever be bought twice", () => {
  it("the owned plan is disabled for BOTH active and cancelled statuses", () => {
    for (const status of ["active", "cancelled"] as const) {
      const s = planState(me("yearly", status), YEARLY, "yearly");
      expect(s.owned).toBe(true);
      expect(s.ctaDisabled).toBe(true);
      expect(s.ctaLabel).toBe("Current plan");
      expect(s.spotlight).toBe(false);
    }
  });

  it("an expired plan (status null) becomes purchasable again", () => {
    const expired = me("monthly", null);
    const s = planState(expired, MONTHLY, "monthly");
    expect(s.owned).toBe(false);
    expect(s.ctaDisabled).toBe(false);
    expect(s.ctaLabel).toBe("Choose Monthly");
  });
});
