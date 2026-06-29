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

// Supported aspect ratios → pixel dimensions for google:4@1 (Imagen).
const ASPECT_WH: Record<string, [number, number]> = {
  "9:16": [768, 1344],
  "1:1": [1024, 1024],
  "3:2": [1248, 832],
  "2:3": [832, 1248],
  "4:3": [1184, 864],
  "3:4": [864, 1184],
  "4:5": [896, 1152],
  "5:4": [1152, 896],
  "16:9": [1344, 768],
  "21:9": [1536, 672],
};

function aspectToWH(aspect?: string): [number, number] {
  return ASPECT_WH[aspect ?? "1:1"] ?? ASPECT_WH["1:1"];
}

// A real Runware AIR id looks like `google:4@1` / `runware:100@1`. The catalog's
// ai_model is free-form text, so only let it override the configured model when
// it's actually an AIR id — otherwise always use the configured default.
const AIR_RE = /^[\w.-]+:\d+@\d+$/;

// Google Imagen models accept a safety tolerance; "none" disables filtering.
function providerSettings(model: string): Record<string, unknown> {
  if (model.startsWith("google:")) {
    return { providerSettings: { google: { safetyTolerance: "none" } } };
  }
  return {};
}

// How a model accepts a source/reference photo differs by family:
//  - Google Imagen (google:*) rejects `seedImage`/`strength`, but supports
//    `referenceImages: [...]` (used to preserve a face/subject from the upload).
//  - FLUX/SD models use the classic img2img pair `seedImage` + `strength`.
// Attaching the upload the wrong way is rejected by the API (the 502 you saw),
// so we branch on the model.
function usesReferenceImages(model: string): boolean {
  return model.startsWith("google:");
}

// Attach the uploaded photo to the task in the form the selected model accepts.
function attachSourceImage(
  task: Record<string, unknown>,
  model: string,
  sourceImage: string,
  strength?: number,
) {
  if (usesReferenceImages(model)) {
    task.referenceImages = [sourceImage]; // accepts URL, data URI, base64, or UUID
  } else {
    task.seedImage = sourceImage;
    task.strength = strength ?? 0.7;
  }
}

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function firstUrl(json: RunwareResponse): string | undefined {
  const item = json.data?.[0] ?? {};
  return str(item.imageURL) ?? str(item.videoURL) ?? str(item.outputURL);
}

const imageModel = (req: GenRequest) =>
  req.model && AIR_RE.test(req.model) ? req.model : config.runware.model.image;
const videoModel = (req: GenRequest) =>
  req.model && AIR_RE.test(req.model) ? req.model : config.runware.model.video;

function imageInferenceTask(req: GenRequest, prompt: string, strength?: number) {
  const [width, height] = aspectToWH(req.aspect);
  const model = imageModel(req);
  const task: Record<string, unknown> = {
    taskType: "imageInference",
    taskUUID: uuid(),
    model,
    positivePrompt: prompt || "a high quality photo",
    width,
    height,
    numberResults: 1,
    includeCost: false,
    outputType: "URL",
    outputFormat: "JPG",
    outputQuality: 95,
    deliveryMethod: "sync",
    ...providerSettings(model),
  };
  if (req.sourceImage) {
    attachSourceImage(task, model, req.sourceImage, strength);
  }
  return task;
}

// Models for the AI Tools (verified against the live API).
const TOOL_MODEL = { inference: "runware:400@5", upscale: "runware:504@1", bgRemove: "runware:112@5" };

// Fixed prompts for the upload-only tools (the user gives a photo, not text).
const RETOUCH_PROMPT = `Professional photo retouching and enhancement.

SUBJECT & COMPOSITION
- Preserve original subject, identity, and composition
- Fix closed or half-open eyes to look naturally open
- Adjust hair covering face to reveal facial features clearly
- Enhance facial details while maintaining a natural, realistic look

SKIN & IMPERFECTIONS
- Remove blemishes, spots, and imperfections naturally
- Smooth crumpled, folded, or creased areas of the photo
- Repair scratches and scan artifacts from physical damage

LIGHTING & COLOR
- Correct exposure if image is too dark or too bright
- Balance colors, contrast, and white balance
- Recover hidden details and improve subject visibility

TECHNICAL
- Reduce noise, blur, and compression artifacts
- Improve sharpness, textures, and fine details

natural skin tones, photorealistic result
cinematic lighting, ultra sharp focus
high dynamic range, 8k resolution, high quality`;

const OLD_TO_NEW_PROMPT = `Professional black-and-white photo colorization.

COLORIZATION
- Convert grayscale photo into a naturally colored image
- Apply realistic, historically accurate colors
- Restore natural skin tones, hair colors, and eye colors
- Add lifelike colors to clothing, objects, and environment

DETAIL & STRUCTURE
- Preserve original composition, identity, and facial structure
- Recover fine textures and details from the source image

LIGHTING & FINISH
- Enhance brightness, contrast, and lighting for visual clarity
- Apply balanced color grading with natural shadows and highlights

natural skin tones, photorealistic result
cinematic lighting, ultra sharp focus
high dynamic range, 8k resolution, high quality`;

// imageInference for the tools — runware:400@5 at the chosen aspect ratio,
// 28 steps, CFGScale 3.5, acceleration high. Text-to-image when no photo;
// image-to-image (referenceImages) when a photo is uploaded.
function toolInferenceTask(
  prompt: string,
  aspect?: string,
  sourceImage?: string,
): Record<string, unknown> {
  const [width, height] = aspectToWH(aspect);
  const task: Record<string, unknown> = {
    taskType: "imageInference",
    taskUUID: uuid(),
    model: TOOL_MODEL.inference,
    positivePrompt: prompt || "a high quality photo",
    width,
    height,
    steps: 28,
    CFGScale: 3.5,
    acceleration: "high",
    numberResults: 1,
    includeCost: false,
    outputType: "URL",
    outputFormat: "JPG",
    outputQuality: 95,
    deliveryMethod: "sync",
  };
  if (sourceImage) task.referenceImages = [sourceImage];
  return task;
}

function toolTask(req: GenRequest): Record<string, unknown> {
  const key = req.toolKey as ToolKey;
  switch (key) {
    case "image_generation":
      // text-to-image from the prompt
      return toolInferenceTask(req.prompt ?? "", req.aspect);
    case "image_enhancer":
      return {
        taskType: "upscale",
        taskUUID: uuid(),
        model: TOOL_MODEL.upscale,
        inputImage: req.sourceImage,
        includeCost: false,
        outputType: "URL",
        outputFormat: "JPG",
        outputQuality: 95,
        deliveryMethod: "sync",
      };
    case "bg_remover":
      return {
        taskType: "removeBackground",
        taskUUID: uuid(),
        model: TOOL_MODEL.bgRemove,
        inputImage: req.sourceImage,
        includeCost: false,
        outputType: "URL",
        outputFormat: "PNG", // PNG keeps the transparent background
        outputQuality: 95,
        deliveryMethod: "sync",
      };
    case "bg_changer":
      return toolInferenceTask(req.prompt ?? "place the subject in a new background scene", req.aspect, req.sourceImage);
    case "retouch":
      // fixed retouch prompt — the user only uploads a photo
      return toolInferenceTask(RETOUCH_PROMPT, req.aspect, req.sourceImage);
    case "old_to_new":
      // fixed colorization prompt — the user only uploads a photo
      return toolInferenceTask(OLD_TO_NEW_PROMPT, req.aspect, req.sourceImage);
    default:
      return toolInferenceTask(req.prompt ?? "", req.aspect);
  }
}

// Video resolution → portrait pixel dimensions for bytedance:2@2 (verified
// against the live API). The model accepts a fixed set, so unknown values snap
// to 480p.
const VIDEO_WH: Record<number, [number, number]> = {
  480: [480, 864],
  720: [704, 1248],
  1080: [1088, 1920],
};
function videoResolutionToWH(res?: number): [number, number] {
  return VIDEO_WH[res ?? 480] ?? VIDEO_WH[480];
}

// bytedance (Seedance) accepts a cameraFixed toggle.
function videoProviderSettings(model: string): Record<string, unknown> {
  if (model.startsWith("bytedance:")) {
    return { providerSettings: { bytedance: { cameraFixed: false } } };
  }
  return {};
}

export const runwareProvider: GenerationProvider = {
  async start(req: GenRequest): Promise<GenOutcome> {
    try {
      if (req.kind === "video") {
        const model = videoModel(req);
        const [width, height] = videoResolutionToWH(req.resolution);
        const task: Record<string, unknown> = {
          taskType: "videoInference",
          taskUUID: uuid(),
          model,
          positivePrompt: req.prompt ?? "",
          width,
          height,
          duration: req.duration ?? config.video.defaultDuration,
          numberResults: 1,
          includeCost: false,
          outputType: "URL",
          outputFormat: "MP4",
          outputQuality: 95,
          deliveryMethod: "async",
          ...videoProviderSettings(model),
          // image-to-video: bytedance uses `frameImages`; other models seedImage
          ...(req.sourceImage
            ? model.startsWith("bytedance:")
              ? { frameImages: [req.sourceImage] }
              : { seedImage: req.sourceImage }
            : {}),
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
        // FLUX (runware:400@5) — applies the style to the uploaded photo via
        // referenceImages. Avoids Imagen's content moderation rejecting photos.
        task = toolInferenceTask(req.prompt ?? "", req.aspect, req.sourceImage);
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
