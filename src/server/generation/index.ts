import "server-only";
import { config, videoCoinCost } from "@/lib/config";
import { store } from "@/server/store";
import type { CoinReason, StoredGeneration } from "@/server/store/types";
import { getViewer } from "@/server/entitlements";
import { rateLimit } from "@/server/rate-limit";
import { catalog } from "@/data/catalog";
import { resolveMedia } from "@/lib/utils";
import type { Generation, GenerationKind, ToolKey } from "@/lib/types";
import type { GenerationProvider, GenRequest } from "./types";
import { mockProvider } from "./mock";
import { runwareProvider } from "./runware";

/** Real provider when a Runware key is set, else the Mock (§3, §6). */
export const provider: GenerationProvider = config.runware.enabled ? runwareProvider : mockProvider;

const COST: Record<GenerationKind, number> = {
  video: config.coinCost.video,
  image: config.coinCost.image,
  filter: config.coinCost.filter,
  tool: config.coinCost.tool,
};

function coinReason(kind: GenerationKind): CoinReason {
  return kind === "video"
    ? "generation_video"
    : kind === "image"
      ? "generation_image"
      : kind === "filter"
        ? "filter"
        : "tool";
}

function nearest(allowed: readonly number[], v: number): number {
  return allowed.reduce((best, x) => (Math.abs(x - v) < Math.abs(best - v) ? x : best), allowed[0]);
}

/** Map requested video toggles to the model's supported set (§7a caveat). */
export function mapVideoToggles(duration?: number, resolution?: number) {
  return {
    duration: nearest(config.video.durations, duration ?? config.video.defaultDuration),
    resolution: nearest(config.video.resolutions, resolution ?? config.video.defaultResolution),
  };
}

export interface RunInput {
  kind: GenerationKind;
  sourceItemType?: "video" | "image" | null;
  sourceItemId?: string | null;
  toolKey?: ToolKey;
  prompt?: string;
  sourceImage?: string;
  duration?: number;
  resolution?: number;
  aspect?: string;
  /** Tool payment for FREE users: "ad" = watch ad (free), "coins" = pay coins. */
  method?: "ad" | "coins";
}

export type RunResult =
  | { ok: true; generationId: string; status: "done" | "processing"; outputUrl?: string | null }
  | { ok: false; status: number; error: string };

/**
 * Run a generation — server-enforced (§6, §7). Verifies auth + (for prompts)
 * that the prompt is unlocked, spends coins atomically, records the generation,
 * calls the provider, and REFUNDS on failure.
 */
export async function runGeneration(input: RunInput): Promise<RunResult> {
  const viewer = await getViewer();
  if (!viewer.userId) return { ok: false, status: 401, error: "Sign in to generate." };

  // Rate-limit generation per user (§10).
  const rl = rateLimit(`gen:${viewer.userId}`, config.generationRatePerMin, 60_000);
  if (!rl.ok) {
    return { ok: false, status: 429, error: `Slow down — try again in ${rl.retryAfter}s.` };
  }

  let prompt = input.prompt ?? "";
  let model: string | undefined;

  // Prompt-driven generate: require the source prompt to be unlocked.
  if ((input.kind === "image" || input.kind === "video") && input.sourceItemId && input.sourceItemType) {
    const unlocked =
      viewer.isPro ||
      (await store.unlocks.isUnlocked(viewer.userId, input.sourceItemType, input.sourceItemId));
    if (!unlocked) return { ok: false, status: 403, error: "Unlock this prompt before generating." };
    const raw = await catalog.rawPrompt(input.sourceItemType, input.sourceItemId);
    if (raw == null) return { ok: false, status: 404, error: "Prompt not found." };
    prompt = raw;
    const detail =
      input.sourceItemType === "video"
        ? await catalog.videoDetail(input.sourceItemId, false)
        : await catalog.imageDetail(input.sourceItemId, false);
    model = detail?.aiModel ?? undefined;
  }

  if (input.kind === "filter" && input.sourceItemId) {
    const fp = await catalog.filterPrompt(input.sourceItemId);
    if (fp == null) return { ok: false, status: 404, error: "Filter not found." };
    prompt = fp;
  }

  // Input validation per flow.
  const needsUpload = input.kind === "filter" || (input.kind === "tool" && input.toolKey !== "image_generation");
  if (needsUpload && !input.sourceImage) {
    return { ok: false, status: 400, error: "Upload a photo first." };
  }
  if (input.kind === "tool" && input.toolKey === "image_generation" && !prompt.trim()) {
    return { ok: false, status: 400, error: "Enter a prompt." };
  }

  // Pro unlocks all aspect ratios; otherwise square only (§6).
  const aspect = viewer.isPro ? (input.aspect ?? "1:1") : "1:1";
  const videoToggles =
    input.kind === "video" ? mapVideoToggles(input.duration, input.resolution) : null;
  const toggles = videoToggles ?? {};

  // Pricing (§1.4):
  //  • video → scales with resolution + duration
  //  • tools → Pro pays coins; a FREE user pays coins OR watches an ad (free)
  //  • image / filter → flat coin cost
  let cost: number;
  if (videoToggles) {
    cost = videoCoinCost(videoToggles.resolution, videoToggles.duration);
  } else if (input.kind === "tool") {
    cost = viewer.isPro || input.method === "coins" ? COST.tool : 0;
  } else {
    cost = COST[input.kind];
  }

  // Atomic spend (only when there's a cost; free tool runs skip the ledger).
  if (cost > 0) {
    const balance = await store.coins.spend({
      userId: viewer.userId,
      amount: cost,
      reason: coinReason(input.kind),
      referenceType: input.kind,
      referenceId: input.sourceItemId ?? input.toolKey ?? null,
    });
    if (balance == null) {
      return { ok: false, status: 402, error: "Not enough coins. Go Pro for more." };
    }
  }

  const gen = await store.generations.create({
    userId: viewer.userId,
    kind: input.kind,
    sourceItemType: input.sourceItemType ?? null,
    sourceItemId: input.sourceItemId ?? null,
    toolKey: input.toolKey ?? null,
    params: { ...toggles, aspect },
    inputMediaPath: input.sourceImage ? "upload" : null,
    coinsSpent: cost,
  });

  const req: GenRequest = {
    kind: input.kind,
    prompt,
    sourceImage: input.sourceImage,
    toolKey: input.toolKey,
    model,
    aspect,
    ...(input.kind === "video" ? toggles : {}),
  };

  let outcome;
  try {
    outcome = await provider.start(req);
  } catch (e) {
    outcome = { status: "failed" as const, error: e instanceof Error ? e.message : "failed" };
  }

  if (outcome.status === "failed") {
    if (cost > 0) await refund(viewer.userId, cost, gen.id);
    await store.generations.update(gen.id, { status: "failed" });
    return { ok: false, status: 502, error: outcome.error ?? "Generation failed." };
  }

  if (outcome.status === "processing") {
    await store.generations.update(gen.id, {
      status: "processing",
      providerTaskId: outcome.providerTaskId ?? null,
    });
    return { ok: true, generationId: gen.id, status: "processing" };
  }

  await store.generations.update(gen.id, {
    status: "done",
    outputMediaPath: outcome.outputUrl ?? null,
  });
  return { ok: true, generationId: gen.id, status: "done", outputUrl: outcome.outputUrl };
}

/** Map a stored generation to the client DTO (media resolved). */
export function toGenerationDto(g: StoredGeneration): Generation {
  return {
    id: g.id,
    kind: g.kind,
    status: g.status,
    outputMediaPath: resolveMedia(g.outputMediaPath),
    inputMediaPath: g.inputMediaPath,
    coinsSpent: g.coinsSpent,
    params: g.params,
    createdAt: g.createdAt.toISOString(),
  };
}

async function refund(userId: string, amount: number, generationId: string) {
  await store.coins.record({
    userId,
    delta: amount,
    reason: "refund",
    referenceType: "generation",
    referenceId: generationId,
  });
}

/** Poll an async generation, advancing its status; refunds on async failure. */
export async function pollGeneration(
  generationId: string,
  userId: string,
): Promise<StoredGeneration | null> {
  const gen = await store.generations.get(generationId);
  if (!gen || gen.userId !== userId) return null;

  if (gen.status === "processing" && gen.providerTaskId) {
    const outcome = await provider.poll(gen.providerTaskId);
    if (outcome.status === "done") {
      return (
        (await store.generations.update(gen.id, {
          status: "done",
          outputMediaPath: outcome.outputUrl ?? null,
        })) ?? gen
      );
    }
    if (outcome.status === "failed") {
      await refund(userId, gen.coinsSpent, gen.id);
      return (await store.generations.update(gen.id, { status: "failed" })) ?? gen;
    }
  }
  return gen;
}
