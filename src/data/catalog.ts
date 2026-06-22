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
import { mock } from "./mock/catalog";
import { dbCatalog } from "./db/catalog";

// Async wrapper over the mock seed (matches dbCatalog's shape).
const mockSource: typeof dbCatalog = {
  videoCategories: async () => mock.videoCategories(),
  imageCategories: async () => mock.imageCategories(),
  filterCategories: async () => mock.filterCategories(),
  videosByCategory: async (id, paging) => mock.videosByCategory(id, paging),
  imagesByCategory: async (id, paging) => mock.imagesByCategory(id, paging),
  videoDetail: async (id, unlocked) => mock.videoDetail(id, unlocked),
  imageDetail: async (id, unlocked) => mock.imageDetail(id, unlocked),
  rawPrompt: async (kind, id) => mock.rawPrompt(kind, id),
  filters: async (categoryId) => mock.filters(categoryId),
  filterDetail: async (id) => mock.filterDetail(id),
  filterPrompt: async (id) => mock.filterPrompt(id),
  tools: async () => mock.tools(),
  toolByKey: async (key) => mock.toolByKey(key),
  featuredVideos: async () => mock.featuredVideos(),
  featuredImages: async () => mock.featuredImages(),
  mosaic: async () => mock.mosaic(),
};

// TODO(integration): when config.existingApiBaseUrl is set (and no DB), use an
// apiCatalog that fetches the upstream API (optional Approach A, §1.1). Shape
// is defined by the owner's API; until then DB-or-mock covers all flows.
const source: typeof dbCatalog = hasDatabase ? dbCatalog : mockSource;

export const catalog = {
  videoCategories: (): Promise<Category[]> => source.videoCategories(),
  imageCategories: (): Promise<Category[]> => source.imageCategories(),
  filterCategories: (): Promise<Category[]> => source.filterCategories(),

  videosByCategory: (
    categoryId: string,
    paging?: { skip?: number; take?: number },
  ): Promise<PromptListItem[]> => source.videosByCategory(categoryId, paging),
  imagesByCategory: (
    categoryId: string,
    paging?: { skip?: number; take?: number },
  ): Promise<PromptListItem[]> => source.imagesByCategory(categoryId, paging),

  videoDetail: (id: string, unlocked: boolean): Promise<PromptDetail | null> =>
    source.videoDetail(id, unlocked),
  imageDetail: (id: string, unlocked: boolean): Promise<PromptDetail | null> =>
    source.imageDetail(id, unlocked),

  /** Server-only: full prompt text (used after an unlock is verified). */
  rawPrompt: (kind: "video" | "image", id: string): Promise<string | null> =>
    source.rawPrompt(kind, id),

  filters: (categoryId?: string): Promise<FilterItem[]> => source.filters(categoryId),
  filterDetail: (id: string): Promise<FilterItem | null> => source.filterDetail(id),
  filterPrompt: (id: string): Promise<string | null> => source.filterPrompt(id),

  tools: (): Promise<Tool[]> => source.tools(),
  toolByKey: (key: string): Promise<Tool | null> => source.toolByKey(key),

  featuredVideos: (): Promise<PromptListItem[]> => source.featuredVideos(),
  featuredImages: (): Promise<PromptListItem[]> => source.featuredImages(),
  mosaic: (): Promise<string[]> => source.mosaic(),
};

/** Build-time flag surfaced in the UI when running on seed data. */
export const usingMockCatalog = config.useMockCatalog;
