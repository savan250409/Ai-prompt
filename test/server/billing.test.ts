import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import {
  verifyWebhookSignature,
  verifyPaymentSignature,
  isValidPlan,
  planById,
} from "@/server/billing";

const WEBHOOK_SECRET = "rzp_webhook_secret"; // matches test/setup.ts
const KEY_SECRET = "rzp_test_secret"; // matches test/setup.ts
const signWebhook = (body: string) =>
  crypto.createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
const signPayment = (orderId: string, paymentId: string) =>
  crypto.createHmac("sha256", KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");

describe("verifyWebhookSignature (Razorpay)", () => {
  const body = JSON.stringify({ event: "order.paid" });

  it("accepts hex(HMAC-SHA256(rawBody, webhookSecret))", () => {
    expect(verifyWebhookSignature(body, signWebhook(body))).toBe(true);
  });

  it("rejects tampered body or missing signature", () => {
    expect(verifyWebhookSignature(body + "x", signWebhook(body))).toBe(false);
    expect(verifyWebhookSignature(body, "")).toBe(false);
  });
});

describe("verifyPaymentSignature (Razorpay)", () => {
  it("accepts hex(HMAC-SHA256(order|payment, keySecret))", () => {
    expect(verifyPaymentSignature("order_1", "pay_1", signPayment("order_1", "pay_1"))).toBe(true);
  });

  it("rejects a wrong/forged signature", () => {
    expect(verifyPaymentSignature("order_1", "pay_1", signPayment("order_1", "pay_2"))).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_1", "")).toBe(false);
  });
});

describe("plans", () => {
  it("validates plan ids", () => {
    expect(isValidPlan("weekly")).toBe(true);
    expect(isValidPlan("monthly")).toBe(true);
    expect(isValidPlan("yearly")).toBe(true);
    expect(isValidPlan("daily")).toBe(false);
    expect(isValidPlan(undefined)).toBe(false);
  });
  it("planById returns the plan or throws on unknown", () => {
    expect(planById("yearly").coins).toBeGreaterThan(0);
    expect(() => planById("nope" as never)).toThrow();
  });
});
