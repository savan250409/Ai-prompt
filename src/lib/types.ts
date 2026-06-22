/**
 * Domain DTOs — the shapes the UI/API exchange (already media-resolved and
 * prompt-gated). The full `ai_prompt` is NEVER part of a list item and is only
 * present on a detail when `unlocked` is true — §6, §8, §14.
 */

export type SoloOrCouple = "Solo" | "Couple";
export type CatalogKind = "video" | "image" | "filter" | "tool";
export type ItemType = "video" | "image" | "filter";

export interface Category {
  id: string;
  name: string;
  image: string | null;
  type?: SoloOrCouple;
  sortOrder: number;
  /** items in this category, if loaded */
  count?: number;
}

/** A prompt as shown in a list/grid (no prompt text at all). */
export interface PromptListItem {
  id: string;
  kind: "video" | "image";
  categoryId: string;
  thumbnail: string | null;
  /** looping preview media (video src) when kind === "video" */
  preview: string | null;
  hint: string | null;
  aspect?: number; // width/height for masonry; default ~0.75
  count: number; // no_of_image / no_of_video
  exclusive?: boolean;
}

/** A prompt detail. `prompt` is present ONLY when `unlocked`. */
export interface PromptDetail extends PromptListItem {
  /** truncated, ad-safe preview shown while locked */
  promptPreview: string;
  /** full model input — present only when unlocked === true */
  prompt: string | null;
  aiModel: string | null;
  unlocked: boolean;
  nameChange: boolean;
}

export interface FilterItem {
  id: string;
  categoryId: string;
  name: string;
  image: string | null;
  /** filter style prompt — gated like other prompts when used for output */
  promptPreview: string;
}

export type ToolKey =
  | "image_generation"
  | "image_enhancer"
  | "bg_remover"
  | "bg_changer"
  | "retouch"
  | "old_to_new";

export interface Tool {
  id: string;
  toolKey: ToolKey;
  name: string;
  description: string;
  beforeImage: string | null;
  afterImage: string | null;
  coinCost: number;
  requiresPro: boolean;
  sortOrder: number;
}

/** Auth + entitlement snapshot returned by /api/me — §8. */
export interface Me {
  authenticated: boolean;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
    phone: string | null;
  } | null;
  isPro: boolean;
  coins: number;
  freeUnlocksRemaining: number;
}

export type GenerationKind = "video" | "image" | "filter" | "tool";
export type GenerationStatus = "queued" | "processing" | "done" | "failed";

export interface Generation {
  id: string;
  kind: GenerationKind;
  status: GenerationStatus;
  outputMediaPath: string | null;
  inputMediaPath: string | null;
  coinsSpent: number;
  params: Record<string, unknown>;
  createdAt: string;
}
