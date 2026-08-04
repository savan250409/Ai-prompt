import type { GenerationKind, ToolKey } from "@/lib/types";

/**
 * GenerationProvider — the abstraction behind all AI generation (§3, §7a).
 * MockGenerationProvider returns placeholder media so every flow runs before a
 * key is set; RunwareGenerationProvider implements §7a (sync images, async
 * video). All calls are SERVER-SIDE ONLY — the key never reaches the browser.
 */
export interface GenRequest {
  kind: GenerationKind;
  /** Positive prompt (text-to-image, prompt-detail generate, prompt tools). */
  prompt?: string;
  /** Source media as a data URI or public URL (img2img, filter, i2v, tools). */
  sourceImage?: string;
  /** Tool selector when kind === "tool". */
  toolKey?: ToolKey;
  /** Video toggles (already validated/mapped to the model's caps). */
  duration?: number;
  resolution?: number;
  /** Image aspect ratio "w:h" (e.g. "1:1", "16:9"). */
  aspect?: string;
  /** Model AIR id override (catalog ai_model > env default). */
  model?: string;
}

export interface GenOutcome {
  status: "done" | "processing" | "failed";
  /** Output media URL when done. */
  outputUrl?: string;
  /** Provider task id for async polling (videos / long tasks). */
  providerTaskId?: string;
  error?: string;
}

export interface GenerationProvider {
  /** Start a task. Sync tasks return done inline; async return processing + id. */
  start(req: GenRequest): Promise<GenOutcome>;
  /** Poll an async task by provider task id. */
  poll(providerTaskId: string): Promise<GenOutcome>;
}
