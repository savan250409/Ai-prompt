import { describe, it, expect } from "vitest";
import { cleanLabel, cleanHint } from "@/lib/labels";

describe("cleanLabel", () => {
  it("corrects known content typos (§audit 16)", () => {
    expect(cleanLabel("Ghibly")).toBe("Ghibli");
    expect(cleanLabel("Mirror Selfi")).toBe("Mirror Selfie");
    expect(cleanLabel("Linked-in Profile")).toBe("LinkedIn Profile");
    expect(cleanLabel("Gpt40-Travel")).toBe("Gpt4o-Travel");
  });

  it("trims and leaves correct names untouched", () => {
    expect(cleanLabel("  Anime  ")).toBe("Anime");
    expect(cleanLabel("Ghibli")).toBe("Ghibli");
  });

  it("returns null for empty/missing", () => {
    expect(cleanLabel(null)).toBeNull();
    expect(cleanLabel(undefined)).toBeNull();
    expect(cleanLabel("   ")).toBeNull();
  });
});

describe("cleanHint", () => {
  it("drops leaked template placeholders (§audit 9)", () => {
    expect(cleanHint("Country Name")).toBeNull();
    expect(cleanHint("Enter your name")).toBeNull();
    expect(cleanHint("  your name ")).toBeNull();
    expect(cleanHint("Enter your city")).toBeNull();
  });

  it("keeps real hints and still corrects typos", () => {
    expect(cleanHint("Royal Indian Throne")).toBe("Royal Indian Throne");
    expect(cleanHint("Ghibly portrait")).toBe("Ghibli portrait");
  });
});
