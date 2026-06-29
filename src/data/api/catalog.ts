import "server-only";
import type {
  Category,
  FilterItem,
  PromptDetail,
  PromptListItem,
  Tool,
} from "@/lib/types";
import { config } from "@/lib/config";
import { truncatePrompt } from "@/lib/utils";
import { TOOL_DEFS } from "@/data/tools";

/**
 * Upstream API catalog source — §1.1 (Approach A). Reads image / video / filter
 * content directly from the live aivibecode API instead of a local DB or mock.
 * Used when CATALOG_API_BASE_URL + CATALOG_API_TOKEN are set (config.api).
 *
 * The catalog is READ-ONLY and the full `ai_prompt` is GATED: it's only placed
 * on a detail DTO when `unlocked` is true, never on a list item.
 *
 * Endpoints (Bearer auth):
 *   GET  /ngd/getAiCategories                 -> image categories (+ preview items)
 *   POST /ngd/getAiImageByCategoryId          -> all images in a category
 *   GET  /ngd/getAiVideoCategories            -> video categories (+ preview items)
 *   POST /ngd/getAiVideoByCategoryId          -> all videos in a category
 *   GET  /filter/getFilterAiCategories        -> filter categories (+ items)
 *   POST /filter/getFilterAiImageByCategoryId -> all filters in a category
 *
 * The API has no "get one item by id" route, so detail/raw-prompt lookups use a
 * lazily-built, TTL-cached index over every category's items.
 */

// ---- persistent stale-while-revalidate cache ------------------------------
//
// The upstream API is often slow (multi-second) or briefly unreachable. So once
// we've fetched something we keep serving it INSTANTLY from memory/disk and
// refresh it in the background. Effect: after the first successful load, every
// inner page opens instantly — and it survives server restarts AND API outages.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const FRESH_MS = 30 * 60 * 1000; // data is "fresh" for 30 min; stale served + refreshed
const FETCH_TIMEOUT_MS = 45000; // the upstream API can be very slow; allow it to finish
const FETCH_TRIES = 3; // retry transient fast-failures (the API drops connections)
const CACHE_FILE = path.join(process.cwd(), ".catalog-cache", "data.json");

type Entry = { t: number; v: unknown };
const mem = new Map<string, Entry>();

// hydrate from disk once at module load (so a fresh server start is already warm)
try {
  const raw = JSON.parse(readFileSync(CACHE_FILE, "utf8")) as Record<string, Entry>;
  for (const [k, e] of Object.entries(raw)) mem.set(k, e);
} catch {
  /* no cache yet */
}

let writeTimer: ReturnType<typeof setTimeout> | null = null;
function persist() {
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    writeTimer = null;
    try {
      mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
      writeFileSync(CACHE_FILE, JSON.stringify(Object.fromEntries(mem)));
    } catch {
      /* best effort */
    }
  }, 2000);
}

const inflight = new Map<string, Promise<unknown>>();

/**
 * Serve cached data instantly; refresh in the background when stale. A cold miss
 * awaits the fetch; a cold FAILURE returns [] without caching (so it retries).
 * fn must THROW on failure so transient errors never poison the cache.
 */
async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = mem.get(key);
  const now = Date.now();
  if (hit) {
    if (now - hit.t >= FRESH_MS && !inflight.has(key)) {
      const p = fn()
        .then((v) => {
          mem.set(key, { t: Date.now(), v });
          persist();
          return v;
        })
        .catch(() => hit.v as T) // keep stale on refresh failure
        .finally(() => inflight.delete(key));
      inflight.set(key, p);
    }
    return hit.v as T; // instant
  }
  if (!inflight.has(key)) {
    const p = fn()
      .then((v) => {
        mem.set(key, { t: Date.now(), v });
        persist();
        return v;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, p);
  }
  try {
    return (await inflight.get(key)) as T;
  } catch {
    return [] as unknown as T; // cold failure: empty, not cached
  }
}

function authHeaders(json = false): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${config.api.token}`,
    Accept: "application/json",
  };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

/** Fetch the envelope's `data` array, retrying transient failures. Throws if all
 *  attempts fail so `cached()` never stores an empty/error result. */
async function fetchData<T>(pathname: string, init: RequestInit): Promise<T[]> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= FETCH_TRIES; attempt++) {
    try {
      const res = await fetch(`${config.api.baseUrl}/${pathname}`, {
        ...init,
        cache: "no-store",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`${pathname} -> ${res.status}`);
      const json = (await res.json()) as ApiEnvelope<T>;
      if (!Array.isArray(json?.data)) throw new Error(`${pathname} -> no data`);
      // The flaky API sometimes returns an empty array on a hiccup. Treat empty
      // as a transient failure so it's NOT cached (which would stick a 404 for
      // 30 min); it retries and self-heals once the API returns real data.
      if (json.data.length === 0) throw new Error(`${pathname} -> empty`);
      return json.data;
    } catch (e) {
      lastErr = e;
      if (attempt < FETCH_TRIES) await new Promise((r) => setTimeout(r, 600 * attempt));
    }
  }
  throw lastErr;
}

/** Pull the `data` array from an API envelope; THROWS on failure (see cached). */
async function apiGet<T = ApiAny>(path: string): Promise<T[]> {
  return cached(`GET ${path}`, () => fetchData<T>(path, { headers: authHeaders() }));
}

async function apiPost<T = ApiAny>(path: string, body: object): Promise<T[]> {
  return cached(`POST ${path} ${JSON.stringify(body)}`, () =>
    fetchData<T>(path, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify(body),
    }),
  );
}

/** Some `*_full_url` values contain literal spaces; encode them (idempotent). */
function fixUrl(u?: string | null): string | null {
  if (!u) return null;
  const s = u.trim();
  return s ? s.replace(/ /g, "%20") : null;
}

// ---- upstream shapes (only the fields we use) ------------------------------

type ApiAny = Record<string, unknown>;
interface ApiEnvelope<T> {
  status?: boolean;
  message?: string;
  data?: T[];
}

interface ApiImageItem {
  id: number;
  ai_prompt: string;
  no_of_image?: number;
  name_change?: number;
  ai_model?: string | null;
  category_image_full_url?: string | null;
  image_hint?: string | null;
}
interface ApiVideoItem {
  id: number;
  ai_prompt: string;
  no_of_video?: number;
  name_change?: number;
  ai_model?: string | null;
  video_thumbnail_full_url?: string | null;
  category_video_full_url?: string | null;
  image_hint?: string | null;
}
interface ApiFilterItem {
  id: number;
  category_id: number;
  name?: string | null;
  ai_prompt: string;
  category_image_full_url?: string | null;
}
interface ApiCategory<I> {
  category_id: number;
  category_name: string;
  category_image_full_url?: string | null;
  items?: I[];
}

// ---- mappers ---------------------------------------------------------------

const imageListItem = (it: ApiImageItem, categoryId: string): PromptListItem => ({
  id: String(it.id),
  kind: "image",
  categoryId,
  thumbnail: fixUrl(it.category_image_full_url),
  preview: null,
  hint: it.image_hint ?? null,
  count: it.no_of_image ?? 1,
  exclusive: false,
});

const videoListItem = (it: ApiVideoItem, categoryId: string): PromptListItem => ({
  id: String(it.id),
  kind: "video",
  categoryId,
  thumbnail: fixUrl(it.video_thumbnail_full_url),
  preview: fixUrl(it.category_video_full_url),
  hint: it.image_hint ?? null,
  count: it.no_of_video ?? 1,
  exclusive: false,
});

const imageDetailOf = (it: ApiImageItem, categoryId: string, unlocked: boolean): PromptDetail => ({
  ...imageListItem(it, categoryId),
  promptPreview: truncatePrompt(it.ai_prompt),
  prompt: unlocked ? it.ai_prompt : null,
  aiModel: it.ai_model ?? null,
  unlocked,
  nameChange: it.name_change === 1,
});

const videoDetailOf = (it: ApiVideoItem, categoryId: string, unlocked: boolean): PromptDetail => ({
  ...videoListItem(it, categoryId),
  promptPreview: truncatePrompt(it.ai_prompt),
  prompt: unlocked ? it.ai_prompt : null,
  aiModel: it.ai_model ?? null,
  unlocked,
  nameChange: it.name_change === 1,
});

const filterItemOf = (f: ApiFilterItem): FilterItem => ({
  id: String(f.id),
  categoryId: String(f.category_id),
  name: f.name ?? "Filter",
  image: fixUrl(f.category_image_full_url),
  promptPreview: truncatePrompt(f.name ? `Reimagine the photo in ${f.name} style` : f.ai_prompt, 10),
});

// ---- category fetchers (with preview items) --------------------------------

const fetchImageCats = () => apiGet<ApiCategory<ApiImageItem>>("ngd/getAiCategories");
const fetchVideoCats = () => apiGet<ApiCategory<ApiVideoItem>>("ngd/getAiVideoCategories");
const fetchFilterCats = () => apiGet<ApiCategory<ApiFilterItem>>("filter/getFilterAiCategories");

const fetchImageItems = (catId: string) =>
  apiPost<ApiImageItem>("ngd/getAiImageByCategoryId", { category_id: catId });
const fetchVideoItems = (catId: string) =>
  apiPost<ApiVideoItem>("ngd/getAiVideoByCategoryId", { category_id: Number(catId) });
const fetchFilterItems = (catId: string) =>
  apiPost<ApiFilterItem>("filter/getFilterAiImageByCategoryId", { category_id: Number(catId) });

function imageCatToCategory(c: ApiCategory<ApiImageItem>, i: number): Category {
  const firstImg = c.items?.find((it) => it.category_image_full_url)?.category_image_full_url;
  return {
    id: String(c.category_id),
    name: c.category_name,
    image: fixUrl(c.category_image_full_url ?? firstImg ?? null),
    sortOrder: i,
    count: c.items?.length,
  };
}
function videoCatToCategory(c: ApiCategory<ApiVideoItem>, i: number): Category {
  const firstThumb = c.items?.find((it) => it.video_thumbnail_full_url)?.video_thumbnail_full_url;
  return {
    id: String(c.category_id),
    name: c.category_name,
    image: fixUrl(c.category_image_full_url ?? firstThumb ?? null),
    sortOrder: i,
    count: c.items?.length,
  };
}

// ---- detail index (id -> item + its category) ------------------------------
//
// A Map can't be JSON-persisted, so the index is kept in an IN-MEMORY memo (not
// the disk cache). It rebuilds cheaply from the raw by-category arrays, which
// ARE disk-cached — so this never re-hits the API once those are warm.

type ImageIdx = Map<string, { it: ApiImageItem; catId: string }>;
type VideoIdx = Map<string, { it: ApiVideoItem; catId: string }>;
let imageIdxMemo: { t: number; m: ImageIdx } | null = null;
let videoIdxMemo: { t: number; m: VideoIdx } | null = null;

async function imageIndex(): Promise<ImageIdx> {
  if (imageIdxMemo && Date.now() - imageIdxMemo.t < FRESH_MS) return imageIdxMemo.m;
  const cats = await fetchImageCats();
  const lists = await Promise.all(
    cats.map(async (c) => ({
      catId: String(c.category_id),
      items: await fetchImageItems(String(c.category_id)),
    })),
  );
  const m: ImageIdx = new Map();
  for (const { catId, items } of lists) for (const it of items) m.set(String(it.id), { it, catId });
  if (m.size > 0) imageIdxMemo = { t: Date.now(), m }; // don't memoize a failed/empty build
  return m;
}

async function videoIndex(): Promise<VideoIdx> {
  if (videoIdxMemo && Date.now() - videoIdxMemo.t < FRESH_MS) return videoIdxMemo.m;
  const cats = await fetchVideoCats();
  const lists = await Promise.all(
    cats.map(async (c) => ({
      catId: String(c.category_id),
      items: await fetchVideoItems(String(c.category_id)),
    })),
  );
  const m: VideoIdx = new Map();
  for (const { catId, items } of lists) for (const it of items) m.set(String(it.id), { it, catId });
  if (m.size > 0) videoIdxMemo = { t: Date.now(), m }; // don't memoize a failed/empty build
  return m;
}

const slice = <T>(arr: T[], paging?: { skip?: number; take?: number }): T[] =>
  paging ? arr.slice(paging.skip ?? 0, (paging.skip ?? 0) + (paging.take ?? arr.length)) : arr;

// ---- tools (API has no tools endpoint -> built-in defs) --------------------

const tools = (): Tool[] =>
  TOOL_DEFS.map((t, i) => ({
    id: t.toolKey,
    toolKey: t.toolKey,
    name: t.name,
    description: t.description,
    beforeImage: null,
    afterImage: t.image,
    coinCost: config.coinCost.tool,
    requiresPro: t.requiresPro,
    sortOrder: i,
  }));

// ---- public source (mirrors dbCatalog's shape) -----------------------------

export const apiCatalog = {
  videoCategories: async (): Promise<Category[]> =>
    (await fetchVideoCats()).map(videoCatToCategory),

  imageCategories: async (): Promise<Category[]> =>
    (await fetchImageCats()).map(imageCatToCategory),

  filterCategories: async (): Promise<Category[]> =>
    (await fetchFilterCats()).map((c, i) => ({
      id: String(c.category_id),
      name: c.category_name,
      image: fixUrl(c.category_image_full_url),
      sortOrder: i,
      count: c.items?.length,
    })),

  videosByCategory: async (
    categoryId: string,
    paging?: { skip?: number; take?: number },
  ): Promise<PromptListItem[]> =>
    slice(await fetchVideoItems(categoryId), paging).map((it) => videoListItem(it, categoryId)),

  imagesByCategory: async (
    categoryId: string,
    paging?: { skip?: number; take?: number },
  ): Promise<PromptListItem[]> =>
    slice(await fetchImageItems(categoryId), paging).map((it) => imageListItem(it, categoryId)),

  // categoryId is an optional fast-path hint (passed from the card the user
  // clicked): with it we fetch ONLY that category (1 cached call) instead of
  // building the full cross-category index. Falls back to the index for
  // direct/deep links that have no hint.
  videoDetail: async (
    id: string,
    unlocked: boolean,
    categoryId?: string,
  ): Promise<PromptDetail | null> => {
    if (categoryId) {
      const it = (await fetchVideoItems(categoryId)).find((x) => String(x.id) === id);
      if (it) return videoDetailOf(it, categoryId, unlocked);
    }
    const e = (await videoIndex()).get(id);
    return e ? videoDetailOf(e.it, e.catId, unlocked) : null;
  },

  imageDetail: async (
    id: string,
    unlocked: boolean,
    categoryId?: string,
  ): Promise<PromptDetail | null> => {
    if (categoryId) {
      const it = (await fetchImageItems(categoryId)).find((x) => String(x.id) === id);
      if (it) return imageDetailOf(it, categoryId, unlocked);
    }
    const e = (await imageIndex()).get(id);
    return e ? imageDetailOf(e.it, e.catId, unlocked) : null;
  },

  rawPrompt: async (
    kind: "video" | "image",
    id: string,
    categoryId?: string,
  ): Promise<string | null> => {
    if (kind === "video") {
      if (categoryId) {
        const it = (await fetchVideoItems(categoryId)).find((x) => String(x.id) === id);
        if (it) return it.ai_prompt;
      }
      return (await videoIndex()).get(id)?.it.ai_prompt ?? null;
    }
    if (categoryId) {
      const it = (await fetchImageItems(categoryId)).find((x) => String(x.id) === id);
      if (it) return it.ai_prompt;
    }
    return (await imageIndex()).get(id)?.it.ai_prompt ?? null;
  },

  filters: async (categoryId?: string): Promise<FilterItem[]> => {
    if (categoryId) return (await fetchFilterItems(categoryId)).map(filterItemOf);
    // no category given -> flatten all categories' items
    const cats = await fetchFilterCats();
    const lists = await Promise.all(cats.map((c) => fetchFilterItems(String(c.category_id))));
    return lists.flat().map(filterItemOf);
  },

  filterDetail: async (id: string): Promise<FilterItem | null> => {
    const all = await apiCatalog.filters();
    return all.find((f) => f.id === id) ?? null;
  },

  filterPrompt: async (id: string): Promise<string | null> => {
    const cats = await fetchFilterCats();
    for (const c of cats) {
      const items = await fetchFilterItems(String(c.category_id));
      const hit = items.find((f) => String(f.id) === id);
      if (hit) return hit.ai_prompt;
    }
    return null;
  },

  tools: async (): Promise<Tool[]> => tools(),
  toolByKey: async (key: string): Promise<Tool | null> =>
    tools().find((t) => t.toolKey === key) ?? null,

  featuredVideos: async (): Promise<PromptListItem[]> => {
    const cats = await fetchVideoCats();
    return cats
      .flatMap((c) => (c.items ?? []).map((it) => videoListItem(it, String(c.category_id))))
      .slice(0, 12);
  },

  featuredImages: async (): Promise<PromptListItem[]> => {
    const cats = await fetchImageCats();
    return cats
      .flatMap((c) => (c.items ?? []).map((it) => imageListItem(it, String(c.category_id))))
      .slice(0, 12);
  },

  mosaic: async (): Promise<string[]> => {
    const [vcats, icats] = await Promise.all([fetchVideoCats(), fetchImageCats()]);
    const vthumbs = vcats
      .flatMap((c) => c.items ?? [])
      .map((it) => fixUrl(it.video_thumbnail_full_url))
      .filter((u): u is string => Boolean(u));
    const ithumbs = icats
      .flatMap((c) => c.items ?? [])
      .map((it) => fixUrl(it.category_image_full_url))
      .filter((u): u is string => Boolean(u));
    return [...vthumbs.slice(0, 6), ...ithumbs.slice(0, 6)];
  },
};
