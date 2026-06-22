import "server-only";
import type { GenerationProvider, GenOutcome, GenRequest } from "./types";
import type { ToolKey } from "@/lib/types";
import { config } from "@/lib/config";
import { uuid } from "@/lib/utils";

/**
 * RunwareGenerationProvider — §7a. REST POST to RUNWARE_API_URL, Bearer auth,
 * body = JSON array of task objects (taskType + client taskUUID). Images use
 * deliveryMethod "sync" (inline result); video uses "async" (returns taskUUID,
 * then poll via getResponse). Models are addressed by AIR id from config —
 * NEVER hardcoded — so dropping in the real models needs no code change.
 *
 * NOTE(integration): exact Runware response field names (imageURL/videoURL/
 * status) may need a tweak against the live API — kept isolated here.
 */
interface RunwareResponse {
  data?: Array<Record<string, unknown>>;
  errors?: Array<{ message?: string }>;
}

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.runware.apiKey}`,
  };
}

async function post(tasks: object[]): Promise<RunwareResponse> {
  const res = await fetch(config.runware.apiUrl, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(tasks),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as RunwareResponse;
  if (!res.ok || (json.errors && json.errors.length > 0)) {
    throw new Error(json.errors?.[0]?.message ?? `Runware error ${res.status}`);
  }
  return json;
}

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
      return [1024, 1024];
  }
}

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function firstUrl(json: RunwareResponse): string | undefined {
  const item = json.data?.[0] ?? {};
  return str(item.imageURL) ?? str(item.videoURL) ?? str(item.outputURL);
}

const imageModel = (req: GenRequest) => req.model || config.runware.model.image;
const videoModel = (req: GenRequest) => req.model || config.runware.model.video;

function imageInferenceTask(req: GenRequest, prompt: string, strength?: number) {
  const [width, height] = aspectToWH(req.aspect);
  const task: Record<string, unknown> = {
    taskType: "imageInference",
    taskUUID: uuid(),
    outputType: "URL",
    deliveryMethod: "sync",
    model: imageModel(req),
    positivePrompt: prompt || "a high quality photo",
    width,
    height,
    numberResults: 1,
  };
  if (req.sourceImage) {
    task.seedImage = req.sourceImage; // accepts URL, data URI, base64, or UUID
    task.strength = strength ?? 0.7;
  }
  return task;
}

function toolTask(req: GenRequest): Record<string, unknown> {
  const key = req.toolKey as ToolKey;
  switch (key) {
    case "image_generation":
      return imageInferenceTask(req, req.prompt ?? "");
    case "image_enhancer":
      return {
        taskType: "imageUpscale",
        taskUUID: uuid(),
        outputType: "URL",
        deliveryMethod: "sync",
        inputImage: req.sourceImage,
        upscaleFactor: 4,
      };
    case "bg_remover":
      return {
        taskType: "imageBackgroundRemoval",
        taskUUID: uuid(),
        outputType: "URL",
        deliveryMethod: "sync",
        inputImage: req.sourceImage,
      };
    case "bg_changer":
      // removal + composite of a new background from the prompt (img2img/inpaint)
      return imageInferenceTask(req, req.prompt ?? "a new background", 0.6);
    case "retouch":
      return imageInferenceTask(req, req.prompt ?? "subtle natural retouch", 0.35);
    case "old_to_new":
      return imageInferenceTask(req, req.prompt ?? "restore and modernize this photo", 0.4);
    default:
      return imageInferenceTask(req, req.prompt ?? "");
  }
}

export const runwareProvider: GenerationProvider = {
  async start(req: GenRequest): Promise<GenOutcome> {
    try {
      if (req.kind === "video") {
        const task: Record<string, unknown> = {
          taskType: "videoInference",
          taskUUID: uuid(),
          outputType: "URL",
          deliveryMethod: "async",
          model: videoModel(req),
          positivePrompt: req.prompt ?? "",
          duration: req.duration,
          width: req.resolution === 720 ? 1280 : 854,
          height: req.resolution === 720 ? 720 : 480,
          ...(req.sourceImage ? { seedImage: req.sourceImage } : {}),
          ...(config.runware.webhookSecret
            ? { webhookURL: `${process.env.NEXTAUTH_URL ?? ""}/api/generate/webhook` }
            : {}),
        };
        const json = await post([task]);
        const taskUUID = str(json.data?.[0]?.taskUUID) ?? (task.taskUUID as string);
        return { status: "processing", providerTaskId: taskUUID };
      }

      let task: Record<string, unknown>;
      if (req.kind === "filter") {
        task = imageInferenceTask(req, req.prompt ?? "", 0.75); // identity-preserving
      } else if (req.kind === "tool") {
        task = toolTask(req);
      } else {
        task = imageInferenceTask(req, req.prompt ?? "");
      }
      const json = await post([task]);
      const url = firstUrl(json);
      if (!url) return { status: "failed", error: "No output returned" };
      return { status: "done", outputUrl: url };
    } catch (e) {
      return { status: "failed", error: e instanceof Error ? e.message : "Generation failed" };
    }
  },

  async poll(providerTaskId: string): Promise<GenOutcome> {
    try {
      const json = await post([{ taskType: "getResponse", taskUUID: providerTaskId }]);
      const item = json.data?.[0] ?? {};
      const status = str(item.status);
      const url = firstUrl(json);
      if (url) return { status: "done", outputUrl: url, providerTaskId };
      if (status === "error" || status === "failed") {
        return { status: "failed", error: "Generation failed", providerTaskId };
      }
      return { status: "processing", providerTaskId };
    } catch (e) {
      return { status: "failed", error: e instanceof Error ? e.message : "Poll failed" };
    }
  },
};
