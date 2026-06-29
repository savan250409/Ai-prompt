import type { ToolKey } from "@/lib/types";
import { config } from "@/lib/config";

/**
 * The app's AI Tools list is FIXED — these six (§4.2, §6). Single source of
 * truth used to seed `ai_tools`, as the DB fallback, and by the mock catalog.
 */
export interface ToolDef {
  toolKey: ToolKey;
  name: string;
  description: string;
  requiresPro: boolean;
  /** Preview image shown on the tool card (static asset under /public). */
  image: string;
}

export const TOOL_DEFS: ToolDef[] = [
  {
    toolKey: "image_generation",
    name: "AI Image Generation",
    description: "Turn a prompt into a stunning image.",
    requiresPro: false,
    image: "/tool-previews/image_generation.jpg",
  },
  {
    toolKey: "image_enhancer",
    name: "AI Image Enhancer",
    description: "Upscale and sharpen up to 4×.",
    requiresPro: false,
    image: "/tool-previews/image_enhancer.jpg",
  },
  {
    toolKey: "bg_remover",
    name: "BG Remover",
    description: "Cut out the subject in one tap.",
    requiresPro: false,
    image: "/tool-previews/bg_remover.jpg",
  },
  {
    toolKey: "bg_changer",
    name: "BG Changer",
    description: "Drop your subject into any scene from a prompt.",
    requiresPro: false,
    image: "/tool-previews/bg_changer.jpg",
  },
  {
    toolKey: "retouch",
    name: "AI Retouch",
    description: "Flawless, natural touch-ups.",
    requiresPro: false,
    image: "/tool-previews/retouch.jpg",
  },
  {
    toolKey: "old_to_new",
    name: "AI Old to New",
    description: "Restore old photos to crisp, modern shots.",
    requiresPro: false,
    image: "/tool-previews/old_to_new.jpg",
  },
];

export const TOOL_ORDER: ToolKey[] = TOOL_DEFS.map((t) => t.toolKey);

/** Default per-tool coin cost (config-driven). */
export const defaultToolCost = () => config.coinCost.tool;
