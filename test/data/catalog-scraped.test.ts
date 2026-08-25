import { describe, it, expect } from "vitest";
import { catalog } from "@/data/catalog";

describe("catalog scraped items and recommendations tests", () => {
  it("can load videoDetail for tr-v-1", async () => {
    const detail = await catalog.videoDetail("tr-v-1", false);
    expect(detail).toBeDefined();
    expect(detail).not.toBeNull();
    expect(detail!.id).toBe("tr-v-1");
    expect(detail!.categoryId).toBe("trending-video-prompts");
  });

  it("can fetch videosByCategory for trending-video-prompts", async () => {
    const sameCat = await catalog.videosByCategory("trending-video-prompts");
    expect(sameCat).toBeDefined();
    expect(sameCat.length).toBeGreaterThan(0);
    
    // Check if the current item is in the same category
    const detail = (await catalog.videoDetail("tr-v-1", false))!;
    const recommended = sameCat.filter((r) => r.id !== detail.id).slice(0, 10);
    console.log("TEST CONSOLE - sameCat.length:", sameCat.length);
    console.log("TEST CONSOLE - recommended.length:", recommended.length);
    expect(recommended.length).toBeGreaterThan(0);
  });
});
