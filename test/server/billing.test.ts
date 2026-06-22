import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { verifyWebhookSignature, isValidPlan, planById } from "@/server/billing";

const SECRET = "cf_test_secret"; // matches test/setup.ts
const sign = (timestamp: string, body: string) =>
  crypto.createHmac("sha256", SECRET).update(timestamp + body).digest("base64");

describe("verifyWebhookSignature (Cashfree)", () => {
  const ts = "1700000000";
  const body = JSON.stringify({ type: "PAYMENT_SUCCESS_WEBHOOK" });

  it("accepts base64(HMAC-SHA256(timestamp + rawBody, secret))", () => {
    expect(verifyWebhookSignature(body, ts, sign(ts, body))).toBe(true);
  });

  it("rejects tampered body, wrong timestamp, or missing signature", () => {
    expect(verifyWebhookSignature(body + "x", ts, sign(ts, body))).toBe(false);
    expect(verifyWebhookSignature(body, "1700000001", sign(ts, body))).toBe(false);
    expect(verifyWebhookSignature(body, ts, "")).toBe(false);
    expect(verifyWebhookSignature(body, "", sign(ts, body))).toBe(false);
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
