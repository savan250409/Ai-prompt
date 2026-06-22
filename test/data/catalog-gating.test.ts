import { describe, it, expect } from "vitest";
import { mock } from "@/data/mock/catalog";

describe("prompt gating — never leak ai_prompt while locked (§6, §14)", () => {
  const videoId = mock.featuredVideos()[0].id;
  const imageId = mock.featuredImages()[0].id;

  it("list items carry no prompt field at all", () => {
    const item = mock.videosByCategory("vc1")[0];
    expect(item).toBeDefined();
    expect("prompt" in item).toBe(false);
  });

  it("locked detail: prompt is null, but a truncated preview is present", () => {
    const d = mock.videoDetail(videoId, false)!;
    expect(d.unlocked).toBe(false);
    expect(d.prompt).toBeNull();
    expect(d.promptPreview.length).toBeGreaterThan(0);
  });

  it("unlocked detail: full prompt present and equals rawPrompt; longer than preview", () => {
    const d = mock.videoDetail(videoId, true)!;
    const raw = mock.rawPrompt("video", videoId);
    expect(d.unlocked).toBe(true);
    expect(d.prompt).toBe(raw);
    expect(d.prompt!.length).toBeGreaterThan(d.promptPreview.length);
  });

  it("same gating for image prompts", () => {
    expect(mock.imageDetail(imageId, false)!.prompt).toBeNull();
    expect(mock.imageDetail(imageId, true)!.prompt).toBe(mock.rawPrompt("image", imageId));
  });

  it("filter DTOs do not carry the full style prompt (server-only)", () => {
    const f = mock.filters()[0];
    expect("fullPrompt" in f).toBe(false);
    expect(mock.filterPrompt(f.id)).toBeTruthy();
  });

  it("returns null for unknown ids", () => {
    expect(mock.videoDetail("nope", true)).toBeNull();
    expect(mock.rawPrompt("video", "nope")).toBeNull();
  });
});
