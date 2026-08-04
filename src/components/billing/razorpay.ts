import { toast } from "sonner";

interface RazorpayResult {
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount?: number;
  currency?: string;
  name: string;
  description?: string;
  order_id?: string;
  subscription_id?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (resp: RazorpayResult) => void;
  modal?: { ondismiss?: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (opts: RazorpayOptions) => { open: () => void };
  }
}

/** Lazy-load the Razorpay checkout script once. */
export function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || window.Razorpay) return resolve();
    const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });
}

export interface RazorpayCheckout {
  keyId: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  // one-time order (top-ups):
  orderId?: string;
  amount?: number;
  currency?: string;
  // recurring subscription (plans):
  subscriptionId?: string;
}

/**
 * Open Razorpay Checkout, then verify the result server-side. Resolves `true`
 * once the payment is verified + fulfilled, `false` if the user closed it or it
 * failed verification. The server is authoritative (verify + webhook).
 */
export async function openRazorpayCheckout(data: RazorpayCheckout): Promise<boolean> {
  await loadRazorpayScript();
  if (!window.Razorpay) {
    toast.error("Could not load the payment window.");
    return false;
  }
  return new Promise((resolve) => {
    let settled = false;
    const done = (v: boolean) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };
    const rzp = new window.Razorpay!({
      key: data.keyId,
      name: data.name,
      description: data.description,
      // recurring subscription OR one-time order (exactly one is set)
      ...(data.subscriptionId
        ? { subscription_id: data.subscriptionId }
        : { order_id: data.orderId, amount: data.amount, currency: data.currency }),
      prefill: data.prefill,
      theme: { color: "#6366f1" },
      handler: async (resp) => {
        try {
          const res = await fetch("/api/billing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resp),
          });
          if (!res.ok) toast.error("Payment could not be verified.");
          done(res.ok);
        } catch {
          done(false);
        }
      },
      modal: { ondismiss: () => done(false) },
    });
    rzp.open();
  });
}
