import { describe, it, expect } from "vitest";
import { mapVideoToggles } from "@/server/generation";

describe("mapVideoToggles", () => {
  it("passes supported values through", () => {
    expect(mapVideoToggles(6, 480)).toEqual({ duration: 6, resolution: 480 });
    expect(mapVideoToggles(12, 720)).toEqual({ duration: 12, resolution: 720 });
  });
  it("snaps unsupported values to the nearest supported (§7a caveat)", () => {
    expect(mapVideoToggles(11, 700)).toEqual({ duration: 12, resolution: 720 });
    expect(mapVideoToggles(5, 400)).toEqual({ duration: 6, resolution: 480 });
  });
  it("falls back to defaults when unset", () => {
    expect(mapVideoToggles()).toEqual({ duration: 6, resolution: 480 });
  });
});
