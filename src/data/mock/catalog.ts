/**
 * Local seed catalog — §1, §12.1. Used until DATABASE_URL / EXISTING_API_BASE_URL
 * is configured, so the whole site renders and every flow runs with no backend.
 * Shapes mirror the real tables (§4.1) post media-resolution and prompt-gating.
 */
import type {
  Category,
  FilterItem,
  PromptDetail,
  PromptListItem,
  Tool,
  ToolKey,
} from "@/lib/types";
import { hashString, truncatePrompt } from "@/lib/utils";

// Public sample videos for hover previews. The old Google sample bucket
// (gtv-videos-bucket) now 403s, so these point at reliably-reachable hosts.
const SAMPLE_VIDEOS = [
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
  "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4",
  "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4",
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "https://www.w3schools.com/html/mov_bbb.mp4",
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_2MB.mp4",
];

// Real photos via loremflickr (picsum.photos is network-blocked in this env).
// Deterministic per-seed: a hash picks the subject keyword + a stable `lock`
// so the same card always shows the same photo. Falls back to the local SVG
// placeholder route if loremflickr is ever unreachable (see next.config).
const PHOTO_TAGS = [
  "portrait",
  "fashion",
  "model",
  "woman",
  "man",
  "face",
  "beauty",
  "girl",
];
const img = (seed: string, w = 800, h = 1100) => {
  const n = hashString(seed);
  const tag = PHOTO_TAGS[n % PHOTO_TAGS.length];
  const lock = (n % 9000) + 1;
  return `https://loremflickr.com/${w}/${h}/${tag}?lock=${lock}`;
};

const ASPECTS = [0.7, 0.75, 0.8, 1, 0.66];

// --- prompt copy generators (read like real model input) --------------------
const IMAGE_DETAILS = [
  "cinematic lighting, 85mm lens, shallow depth of field",
  "volumetric god rays, soft rim light, film grain",
  "shot on Kodak Portra 400, hyperreal skin texture",
  "studio softbox, glossy highlights, editorial retouch",
  "golden hour backlight, dreamy bokeh, pastel palette",
  "moody chiaroscuro, deep shadows, teal-and-orange grade",
];

const VIDEO_MOVES = [
  "slow cinematic dolly-in",
  "sweeping crane shot",
  "handheld push toward subject",
  "orbiting parallax move",
  "slow-motion tracking shot",
  "subtle gimbal float",
];

function buildImagePrompt(theme: string, i: number): string {
  const d = IMAGE_DETAILS[i % IMAGE_DETAILS.length];
  return `Ultra-detailed ${theme.toLowerCase()} portrait, ${d}, intricate detail, photorealistic, 8k, trending on ArtStation, masterpiece — variation ${i + 1}`;
}

function buildVideoPrompt(theme: string, i: number): string {
  const m = VIDEO_MOVES[i % VIDEO_MOVES.length];
  return `${m} on a ${theme.toLowerCase()} scene, volumetric haze, 24fps anamorphic, shallow depth of field, photorealistic, natural motion, 4k cinematic color grade — shot ${i + 1}`;
}

// --- category definitions ---------------------------------------------------
const VIDEO_CATS: { name: string; type: "Solo" | "Couple" }[] = [
  { name: "Cinematic Portraits", type: "Solo" },
  { name: "Neon Couples", type: "Couple" },
  { name: "Fantasy Worlds", type: "Solo" },
  { name: "Street Style", type: "Solo" },
  { name: "Dreamy Weddings", type: "Couple" },
  { name: "Sci-Fi Heroes", type: "Solo" },
];

const IMAGE_CATS: { name: string; type: "Solo" | "Couple" }[] = [
  { name: "Editorial Fashion", type: "Solo" },
  { name: "Romantic Couples", type: "Couple" },
  { name: "Cyberpunk City", type: "Solo" },
  { name: "Vintage Film", type: "Solo" },
  { name: "Ethereal Portraits", type: "Solo" },
  { name: "Adventure & Travel", type: "Solo" },
];

const FILTER_CATS: { name: string; filters: string[] }[] = [
  {
    name: "Art Styles",
    filters: ["Ghibli", "Pixar 3D", "Anime", "Pop Art", "Watercolor", "Oil Painting"],
  },
  {
    name: "Eras",
    filters: ["90s Film", "Vaporwave", "Renaissance", "Cyberpunk", "Noir"],
  },
  {
    name: "Portrait FX",
    filters: ["Studio Light", "Black & White", "Golden Hour", "Neon Glow", "Pencil Sketch"],
  },
];

const TOOLS_DEF: {
  toolKey: ToolKey;
  name: string;
  description: string;
  requiresPro: boolean;
}[] = [
  { toolKey: "image_generation", name: "AI Image Generation", description: "Turn a prompt into a stunning image.", requiresPro: false },
  { toolKey: "image_enhancer", name: "AI Image Enhancer", description: "Upscale and sharpen up to 4×.", requiresPro: false },
  { toolKey: "bg_remover", name: "BG Remover", description: "Cut out the subject in one tap.", requiresPro: false },
  { toolKey: "bg_changer", name: "BG Changer", description: "Drop your subject into any scene.", requiresPro: true },
  { toolKey: "retouch", name: "AI Retouch", description: "Flawless, natural touch-ups.", requiresPro: true },
  { toolKey: "old_to_new", name: "AI Old to New", description: "Restore old photos to crisp modern shots.", requiresPro: true },
];

// --- materialize ------------------------------------------------------------
type RawPrompt = {
  id: string;
  kind: "video" | "image";
  categoryId: string;
  thumbnail: string;
  preview: string | null;
  hint: string;
  aspect: number;
  count: number;
  exclusive: boolean;
  prompt: string;
  aiModel: string | null;
  nameChange: boolean;
};

function buildCategories(
  defs: { name: string; type: "Solo" | "Couple" }[],
  prefix: string,
): Category[] {
  return defs.map((d, i) => ({
    id: `${prefix}${i + 1}`,
    name: d.name,
    image: img(`${prefix}cat${i}`, 480, 340),
    type: d.type,
    sortOrder: i,
    count: 16,
  }));
}

function buildPrompts(
  cats: Category[],
  kind: "video" | "image",
  perCat = 16,
): RawPrompt[] {
  const out: RawPrompt[] = [];
  cats.forEach((cat, ci) => {
    for (let i = 0; i < perCat; i++) {
      const seed = `${kind}-${ci}-${i}`;
      const aspect = ASPECTS[hashString(seed) % ASPECTS.length];
      const w = 480;
      const h = Math.round(w / aspect);
      out.push({
        id: `${kind === "video" ? "v" : "i"}_${cat.id}_${i + 1}`,
        kind,
        categoryId: cat.id,
        thumbnail: img(seed, w, h),
        preview: kind === "video" ? SAMPLE_VIDEOS[(ci * perCat + i) % SAMPLE_VIDEOS.length] : null,
        hint: `${cat.name} · ${kind === "video" ? "motion" : "still"} ${i + 1}`,
        aspect,
        count: kind === "video" ? 1 : 1 + (i % 3),
        exclusive: i % 7 === 0,
        prompt:
          kind === "video" ? buildVideoPrompt(cat.name, i) : buildImagePrompt(cat.name, i),
        aiModel: null,
        nameChange: i % 4 === 0,
      });
    }
  });
  return out;
}

const videoCategories = buildCategories(VIDEO_CATS, "vc");
const imageCategories = buildCategories(IMAGE_CATS, "ic");
const videos = buildPrompts(videoCategories, "video");
const images = buildPrompts(imageCategories, "image");

const filterCategories: Category[] = FILTER_CATS.map((c, i) => ({
  id: `fc${i + 1}`,
  name: c.name,
  image: img(`fc${i}`, 480, 340),
  sortOrder: i,
  count: c.filters.length,
}));

const filterList: FilterItem[] = [];
const filterPrompts = new Map<string, string>();
FILTER_CATS.forEach((c, ci) => {
  c.filters.forEach((name, i) => {
    const id = `f_${ci + 1}_${i + 1}`;
    filterList.push({
      id,
      categoryId: `fc${ci + 1}`,
      name,
      image: img(`filter-${ci}-${i}`, 380, 380),
      promptPreview: truncatePrompt(`Reimagine the photo in ${name} style`, 10),
    });
    // full style prompt is server-only (never shipped with the list/detail)
    filterPrompts.set(
      id,
      `Reimagine the uploaded photo in a ${name} style — preserve the subject's identity and pose, apply ${name} textures, palette, and linework, high detail, clean edges.`,
    );
  });
});

const tools: Tool[] = TOOLS_DEF.map((t, i) => ({
  id: `tool_${i + 1}`,
  toolKey: t.toolKey,
  name: t.name,
  description: t.description,
  beforeImage: img(`tool-before-${i}`, 420, 420),
  afterImage: img(`tool-after-${i}`, 420, 420),
  coinCost: 3,
  requiresPro: t.requiresPro,
  sortOrder: i,
}));

// --- mappers ----------------------------------------------------------------
const toListItem = (p: RawPrompt): PromptListItem => ({
  id: p.id,
  kind: p.kind,
  categoryId: p.categoryId,
  thumbnail: p.thumbnail,
  preview: p.preview,
  hint: p.hint,
  aspect: p.aspect,
  count: p.count,
  exclusive: p.exclusive,
});

const toDetail = (p: RawPrompt, unlocked: boolean): PromptDetail => ({
  ...toListItem(p),
  promptPreview: truncatePrompt(p.prompt),
  prompt: unlocked ? p.prompt : null,
  aiModel: p.aiModel,
  unlocked,
  nameChange: p.nameChange,
});

function page<T>(arr: T[], paging?: { skip?: number; take?: number }): T[] {
  if (!paging) return arr;
  const skip = paging.skip ?? 0;
  return arr.slice(skip, skip + (paging.take ?? arr.length));
}

// --- public mock API --------------------------------------------------------
export const mock = {
  videoCategories: (): Category[] => videoCategories,
  imageCategories: (): Category[] => imageCategories,
  filterCategories: (): Category[] => filterCategories,

  videosByCategory: (
    categoryId: string,
    paging?: { skip?: number; take?: number },
  ): PromptListItem[] => page(videos.filter((v) => v.categoryId === categoryId), paging).map(toListItem),
  imagesByCategory: (
    categoryId: string,
    paging?: { skip?: number; take?: number },
  ): PromptListItem[] => page(images.filter((v) => v.categoryId === categoryId), paging).map(toListItem),

  videoDetail: (id: string, unlocked: boolean): PromptDetail | null => {
    const p = videos.find((v) => v.id === id);
    return p ? toDetail(p, unlocked) : null;
  },
  imageDetail: (id: string, unlocked: boolean): PromptDetail | null => {
    const p = images.find((v) => v.id === id);
    return p ? toDetail(p, unlocked) : null;
  },
  /** Server-only: full prompt text for an unlocked item. */
  rawPrompt: (kind: "video" | "image", id: string): string | null => {
    const src = kind === "video" ? videos : images;
    return src.find((p) => p.id === id)?.prompt ?? null;
  },

  filters: (categoryId?: string): FilterItem[] =>
    categoryId ? filterList.filter((f) => f.categoryId === categoryId) : filterList,
  filterDetail: (id: string): FilterItem | null =>
    filterList.find((f) => f.id === id) ?? null,
  filterPrompt: (id: string): string | null => filterPrompts.get(id) ?? null,

  tools: (): Tool[] => tools,
  toolByKey: (key: string): Tool | null => tools.find((t) => t.toolKey === key) ?? null,

  // home rails — kept lean for fast first paint (offscreen rail items lazy-load)
  featuredVideos: (): PromptListItem[] => videos.slice(0, 8).map(toListItem),
  featuredImages: (): PromptListItem[] => images.slice(0, 8).map(toListItem),
  mosaic: (): string[] =>
    [...videos.slice(0, 5), ...images.slice(0, 5)].map((p) => p.thumbnail),
};
