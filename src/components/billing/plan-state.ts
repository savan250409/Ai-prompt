import type { PlanId } from "@/lib/config";
import type { Me } from "@/lib/types";

/**
 * Pure presentation rules for a Go Pro plan card. Kept OUT of the "use client"
 * module so it stays importable from tests/server code.
 *
 * The plan you OWN is `me.plan` — whether it's still renewing ("active") or
 * cancelled but not yet expired ("cancelled"). Either way it's *your* plan, so:
 *  • it is never badged or spotlighted (§3 — "active plan not highlighted"),
 *  • it is DISABLED — you can't re-buy a plan you still hold. A cancelled plan
 *    only becomes purchasable again once it expires (§3 — "not buy when current
 *    plan [hasn't] expired"),
 *  • and every OTHER plan offers only "Upgrade" once you own one.
 * With no plan at all, each card invites you to choose it.
 */
export interface PlanState {
  /** This card is the plan the user owns (active or cancelled). */
  owned: boolean;
  active: boolean;
  cancelled: boolean;
  spotlight: boolean;
  ctaLabel: string;
  ctaDisabled: boolean;
}

export function planState(
  me: Me | null,
  plan: { id: PlanId; name: string },
  selectedId: PlanId,
): PlanState {
  const status = me?.planStatus ?? null;
  const hasPlan = Boolean(me?.plan) && (status === "active" || status === "cancelled");

  const owned = hasPlan && me?.plan === plan.id;
  const active = owned && status === "active";
  const cancelled = owned && status === "cancelled";

  // An owned plan is calm — never badged, never spotlighted. It's already yours.
  const spotlight = !owned && plan.id === selectedId;

  const ctaLabel = owned
    ? "Current plan"
    : hasPlan
      ? "Upgrade"
      : `Choose ${plan.name}`;

  // You already hold this plan — it can't be bought again until it expires.
  return { owned, active, cancelled, spotlight, ctaLabel, ctaDisabled: owned };
}
