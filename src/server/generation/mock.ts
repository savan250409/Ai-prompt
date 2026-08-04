import "server-only";
import type { GenerationProvider, GenOutcome, GenRequest } from "./types";
import { hashString } from "@/lib/utils";

/**
 * MockGenerationProvider — placeholder media so every generation flow runs
 * before RUNWARE_API_KEY is set (§3, §7a). Sync image/filter/tool return inline;
 * video is async (processing -> done after a short simulated delay).
 */
const SAMPLE_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
];

const g = globalThis as unknown as { __mockGenTasks?: Map<string, { doneAt: number; url: string }> };
const tasks = g.__mockGenTasks ?? (g.__mockGenTasks = new Map());

function aspectToWH(aspect?: string): [number, number] {
  switch (aspect) {
    case "3:4":
      return [768, 1024];
    case "4:3":
      return [1024, 768];
    case "16:9":
      return [1024, 576];
    case "9:16":
      return [576, 1024];
    default:
      return [768, 768];
  }
}

function placeholder(seed: string, w: number, h: number) {
  return `https://picsum.photos/seed/gen-${seed}/${w}/${h}`;
}

export const mockProvider: GenerationProvider = {
  async start(req: GenRequest): Promise<GenOutcome> {
    const basis =
      (req.prompt ?? "") +
      (req.toolKey ?? "") +
      (req.sourceImage?.slice(0, 24) ?? "") +
      Math.floor(Math.random() * 1e6);
    const seed = String(hashString(basis));

    if (req.kind === "video") {
      const taskId = crypto.randomUUID();
      const url = SAMPLE_VIDEOS[hashString(seed) % SAMPLE_VIDEOS.length];
      tasks.set(taskId, { doneAt: Date.now() + 3500, url });
      return { status: "processing", providerTaskId: taskId };
    }

    const [w, h] = aspectToWH(req.aspect);
    return { status: "done", outputUrl: placeholder(seed, w, h) };
  },

  async poll(taskId: string): Promise<GenOutcome> {
    const t = tasks.get(taskId);
    if (!t) return { status: "failed", error: "Unknown task" };
    if (Date.now() >= t.doneAt) {
      return { status: "done", outputUrl: t.url, providerTaskId: taskId };
    }
    return { status: "processing", providerTaskId: taskId };
  },
};
