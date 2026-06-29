"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

/**
 * Cancel-subscription control for the billing page. Cancels at period end — the
 * user keeps Pro until their renewal date, it just won't renew. Confirms first.
 */
export function CancelPlanButton({ activeUntil }: { activeUntil: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function cancel() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't cancel your plan.");
        return;
      }
      toast.success(`Subscription cancelled. Pro stays active until ${activeUntil}.`);
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center gap-2 rounded-pill border border-danger/50 px-4 py-2 text-caption font-semibold text-danger transition-colors hover:bg-danger hover:text-white"
      >
        <XCircle className="h-4 w-4" />
        Cancel subscription
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Cancel subscription?">
        <p className="text-sm text-mid">
          Your plan will not renew. You&rsquo;ll keep Pro access and any remaining benefits until{" "}
          <span className="font-medium text-hi">{activeUntil}</span>, after which your account
          returns to the free plan.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
            Keep my plan
          </Button>
          <Button type="button" variant="danger" onClick={cancel} loading={loading}>
            Cancel subscription
          </Button>
        </div>
      </Modal>
    </>
  );
}
