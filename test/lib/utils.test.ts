import { describe, it, expect } from "vitest";
import { resolveMedia, truncatePrompt, formatInr, hashString, pluralize } from "@/lib/utils";

describe("resolveMedia", () => {
  it("passes through absolute and data URLs", () => {
    expect(resolveMedia("https://cdn.x/a.png")).toBe("https://cdn.x/a.png");
    expect(resolveMedia("http://cdn.x/a.png")).toBe("http://cdn.x/a.png");
    expect(resolveMedia("data:image/png;base64,AAAA")).toBe("data:image/png;base64,AAAA");
  });
  it("returns null for empty/missing", () => {
    expect(resolveMedia(null)).toBeNull();
    expect(resolveMedia(undefined)).toBeNull();
    expect(resolveMedia("   ")).toBeNull();
  });
  it("roots relative paths (no MEDIA_BASE_URL in test => leading slash)", () => {
    expect(resolveMedia("foo/bar.png")).toBe("/foo/bar.png");
    expect(resolveMedia("/foo/bar.png")).toBe("/foo/bar.png");
  });
});

describe("truncatePrompt", () => {
  it("truncates long prompts and never returns the full text", () => {
    const full = Array.from({ length: 40 }, (_, i) => `word${i}`).join(" ");
    const out = truncatePrompt(full, 14);
    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBeLessThan(full.length);
    expect(out.split(/\s+/).length).toBeLessThanOrEqual(15); // 14 words + ellipsis
  });
  it("leaves short prompts unchanged", () => {
    expect(truncatePrompt("a short prompt", 14)).toBe("a short prompt");
  });
});

describe("formatInr / pluralize", () => {
  it("formats INR with Indian grouping", () => {
    expect(formatInr(1199)).toBe("₹1,199");
    expect(formatInr(49)).toBe("₹49");
  });
  it("pluralizes", () => {
    expect(pluralize(1, "video prompt")).toBe("1 video prompt");
    expect(pluralize(3, "video prompt")).toBe("3 video prompts");
  });
});

describe("hashString", () => {
  it("is deterministic", () => {
    expect(hashString("abc")).toBe(hashString("abc"));
    expect(hashString("abc")).not.toBe(hashString("abd"));
  });
});
