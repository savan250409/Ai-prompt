/**
 * Catalog data-access facade — the single surface pages & API routes call.
 * Source is chosen by config (§1.1): Prisma/MySQL when DATABASE_URL is set,
 * else the local mock seed so the app runs with no backend. Same async API
 * either way, so callers never change. Catalog is READ-ONLY (§1, §14).
 */
import "server-only";
import type {
  Category,
  FilterItem,
  PromptDetail,
  PromptListItem,
  Tool,
} from "@/lib/types";
import { config } from "@/lib/config";
import { hasDatabase } from "@/lib/prisma";
import { cleanHint, cleanLabel } from "@/lib/labels";
import { mock } from "./mock/catalog";
import { dbCatalog } from "./db/catalog";
import { apiCatalog } from "./api/catalog";

// Sanitize upstream content text once, at the facade, so every consumer (cards,
// breadcrumbs, page heroes, metadata, JSON-LD) gets corrected names and no
// leaked template placeholders — §audit 9 & 16.
const fixCategory = (c: Category): Category => ({ ...c, name: cleanLabel(c.name) ?? c.name });
const fixFilter = (f: FilterItem): FilterItem => ({ ...f, name: cleanLabel(f.name) ?? f.name });
const fixListItem = (p: PromptListItem): PromptListItem => ({ ...p, hint: cleanHint(p.hint) });
const fixDetail = (p: PromptDetail | null): PromptDetail | null =>
  p ? { ...p, hint: cleanHint(p.hint) } : null;

// Async wrapper over the mock seed (matches dbCatalog's shape).
const mockSource: typeof dbCatalog = {
  videoCategories: async () => mock.videoCategories(),
  imageCategories: async () => mock.imageCategories(),
  filterCategories: async () => mock.filterCategories(),
  videosByCategory: async (id, paging) => mock.videosByCategory(id, paging),
  imagesByCategory: async (id, paging) => mock.imagesByCategory(id, paging),
  videoDetail: async (id, unlocked, _categoryId) => mock.videoDetail(id, unlocked),
  imageDetail: async (id, unlocked, _categoryId) => mock.imageDetail(id, unlocked),
  rawPrompt: async (kind, id, _categoryId) => mock.rawPrompt(kind, id),
  filters: async (categoryId) => mock.filters(categoryId),
  filterDetail: async (id) => mock.filterDetail(id),
  filterPrompt: async (id) => mock.filterPrompt(id),
  tools: async () => mock.tools(),
  toolByKey: async (key) => mock.toolByKey(key),
  featuredVideos: async () => mock.featuredVideos(),
  featuredImages: async () => mock.featuredImages(),
  mosaic: async () => mock.mosaic(),
};

// Source precedence (§1.1): live upstream API > local DB > local mock seed.
// The API source reads image/video/filter content directly from aivibecode.
const source: typeof dbCatalog = config.api.enabled
  ? apiCatalog
  : hasDatabase
    ? dbCatalog
    : mockSource;

export const catalog = {
  videoCategories: (): Promise<Category[]> =>
    source.videoCategories().then((cs) => cs.map(fixCategory)),
  imageCategories: (): Promise<Category[]> =>
    source.imageCategories().then((cs) => cs.map(fixCategory)),
  filterCategories: (): Promise<Category[]> =>
    source.filterCategories().then((cs) => cs.map(fixCategory)),

  videosByCategory: (
    categoryId: string,
    paging?: { skip?: number; take?: number },
  ): Promise<PromptListItem[]> =>
    source.videosByCategory(categoryId, paging).then((ps) => ps.map(fixListItem)),
  imagesByCategory: (
    categoryId: string,
    paging?: { skip?: number; take?: number },
  ): Promise<PromptListItem[]> =>
    source.imagesByCategory(categoryId, paging).then((ps) => ps.map(fixListItem)),

  videoDetail: (id: string, unlocked: boolean, categoryId?: string): Promise<PromptDetail | null> =>
    source.videoDetail(id, unlocked, categoryId).then(fixDetail),
  imageDetail: (id: string, unlocked: boolean, categoryId?: string): Promise<PromptDetail | null> =>
    source.imageDetail(id, unlocked, categoryId).then(fixDetail),

  /** Server-only: full prompt text (used after an unlock is verified). */
  rawPrompt: (kind: "video" | "image", id: string, categoryId?: string): Promise<string | null> =>
    source.rawPrompt(kind, id, categoryId),

  filters: (categoryId?: string): Promise<FilterItem[]> =>
    source.filters(categoryId).then((fs) => fs.map(fixFilter)),
  filterDetail: (id: string): Promise<FilterItem | null> =>
    source.filterDetail(id).then((f) => (f ? fixFilter(f) : null)),
  filterPrompt: (id: string): Promise<string | null> => source.filterPrompt(id),

  tools: (): Promise<Tool[]> => source.tools(),
  toolByKey: (key: string): Promise<Tool | null> => source.toolByKey(key),

  featuredVideos: (): Promise<PromptListItem[]> =>
    source.featuredVideos().then((ps) => ps.map(fixListItem)),
  featuredImages: (): Promise<PromptListItem[]> =>
    source.featuredImages().then((ps) => ps.map(fixListItem)),
  mosaic: (): Promise<string[]> => source.mosaic(),
};

/** Build-time flag surfaced in the UI when running on seed data. */
export const usingMockCatalog = config.useMockCatalog;
