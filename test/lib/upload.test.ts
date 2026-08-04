import { describe, it, expect } from "vitest";
import { validateImageDataUri } from "@/lib/upload";

describe("validateImageDataUri", () => {
  it("accepts JPG/PNG/WebP data URIs", () => {
    for (const t of ["jpeg", "png", "webp"]) {
      const v = `data:image/${t};base64,AAAA`;
      expect(validateImageDataUri(v)).toEqual({ value: v });
    }
  });

  it("treats empty/missing as no-upload (no error)", () => {
    expect(validateImageDataUri(undefined)).toEqual({});
    expect(validateImageDataUri(null)).toEqual({});
    expect(validateImageDataUri("")).toEqual({});
  });

  it("rejects non-image and non-data-uri input", () => {
    expect(validateImageDataUri("data:application/pdf;base64,AAAA").error).toBeDefined();
    expect(validateImageDataUri("https://x/a.png").error).toBeDefined();
    expect(validateImageDataUri("data:image/gif;base64,AAAA").error).toBeDefined();
    expect(validateImageDataUri(42).error).toBeDefined();
  });

  it("rejects oversize payloads", () => {
    const huge = "data:image/png;base64," + "A".repeat(17_000_001);
    expect(validateImageDataUri(huge).error).toBeDefined();
  });
});
