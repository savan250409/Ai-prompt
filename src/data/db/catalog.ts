import "server-only";
import type {
  Category,
  FilterItem,
  PromptDetail,
  PromptListItem,
  Tool,
  ToolKey,
} from "@/lib/types";
import { resolveMedia, truncatePrompt } from "@/lib/utils";
import { config } from "@/lib/config";
import { getPrisma } from "@/lib/prisma";
import { TOOL_DEFS } from "@/data/tools";

/**
 * Prisma/MySQL implementation of the catalog facade. Mirrors the mock's shape
 * (media-resolved, prompt-gated). Used when DATABASE_URL is set (§1.1).
 * Read-only — no writes to the existing content tables (§1).
 */

const toBig = (id: string) => BigInt(id);
const visible = { status: 1 } as const;
const bySort = { sort_order: "asc" as const };

type Cat = {
  id: bigint;
  category_name: string;
  category_image: string | null;
  type?: "Solo" | "Couple";
  sort_order: number;
};

function mapCategory(c: Cat): Category {
  return {
    id: c.id.toString(),
    name: c.category_name,
    image: resolveMedia(c.category_image),
    type: c.type,
    sortOrder: c.sort_order,
  };
}

type VideoRow = {
  id: bigint;
  category_id: bigint;
  video_thumbnail: string | null;
  video_path: string;
  ai_prompt: string;
  ai_model: string | null;
  no_of_video: number;
  name_change: number;
  image_hint: string | null;
};

type ImageRow = {
  id: bigint;
  category_id: bigint;
  image_path: string;
  ai_prompt: string;
  ai_model: string | null;
  no_of_image: number;
  name_change: number;
  image_hint: string | null;
};

const videoListItem = (v: VideoRow): PromptListItem => ({
  id: v.id.toString(),
  kind: "video",
  categoryId: v.category_id.toString(),
  thumbnail: resolveMedia(v.video_thumbnail ?? v.video_path),
  preview: resolveMedia(v.video_path),
  hint: v.image_hint,
  count: v.no_of_video,
  exclusive: false,
});

const imageListItem = (i: ImageRow): PromptListItem => ({
  id: i.id.toString(),
  kind: "image",
  categoryId: i.category_id.toString(),
  thumbnail: resolveMedia(i.image_path),
  preview: null,
  hint: i.image_hint,
  count: i.no_of_image,
  exclusive: false,
});

const videoDetail = (v: VideoRow, unlocked: boolean): PromptDetail => ({
  ...videoListItem(v),
  promptPreview: truncatePrompt(v.ai_prompt),
  prompt: unlocked ? v.ai_prompt : null,
  aiModel: v.ai_model,
  unlocked,
  nameChange: v.name_change === 1,
});

const imageDetail = (i: ImageRow, unlocked: boolean): PromptDetail => ({
  ...imageListItem(i),
  promptPreview: truncatePrompt(i.ai_prompt),
  prompt: unlocked ? i.ai_prompt : null,
  aiModel: i.ai_model,
  unlocked,
  nameChange: i.name_change === 1,
});

function fallbackTools(): Tool[] {
  return TOOL_DEFS.map((t, i) => ({
    id: t.toolKey,
    toolKey: t.toolKey,
    name: t.name,
    description: t.description,
    beforeImage: null,
    afterImage: null,
    coinCost: config.coinCost.tool,
    requiresPro: t.requiresPro,
    sortOrder: i,
  }));
}

export const dbCatalog = {
  videoCategories: async (): Promise<Category[]> =>
    (
      await getPrisma().ngendev_video_categories.findMany({ where: visible, orderBy: bySort })
    ).map((c) => mapCategory(c as Cat)),

  imageCategories: async (): Promise<Category[]> =>
    (await getPrisma().ngendev_categories.findMany({ where: visible, orderBy: bySort })).map((c) =>
      mapCategory(c as Cat),
    ),

  filterCategories: async (): Promise<Category[]> =>
    (
      await getPrisma().filter_ai_image_categories.findMany({ where: visible, orderBy: bySort })
    ).map((c) => mapCategory(c as Cat)),

  videosByCategory: async (
    categoryId: string,
    paging?: { skip?: number; take?: number },
  ): Promise<PromptListItem[]> =>
    (
      await getPrisma().ngendev_videos.findMany({
        where: { category_id: toBig(categoryId) },
        orderBy: bySort,
        skip: paging?.skip,
        take: paging?.take,
      })
    ).map((v) => videoListItem(v as VideoRow)),

  imagesByCategory: async (
    categoryId: string,
    paging?: { skip?: number; take?: number },
  ): Promise<PromptListItem[]> =>
    (
      await getPrisma().ngendev_images.findMany({
        where: { category_id: toBig(categoryId) },
        orderBy: bySort,
        skip: paging?.skip,
        take: paging?.take,
      })
    ).map((i) => imageListItem(i as ImageRow)),

  videoDetail: async (id: string, unlocked: boolean): Promise<PromptDetail | null> => {
    const v = await getPrisma().ngendev_videos.findUnique({ where: { id: toBig(id) } });
    return v ? videoDetail(v as VideoRow, unlocked) : null;
  },

  imageDetail: async (id: string, unlocked: boolean): Promise<PromptDetail | null> => {
    const i = await getPrisma().ngendev_images.findUnique({ where: { id: toBig(id) } });
    return i ? imageDetail(i as ImageRow, unlocked) : null;
  },

  rawPrompt: async (kind: "video" | "image", id: string): Promise<string | null> => {
    if (kind === "video") {
      const v = await getPrisma().ngendev_videos.findUnique({
        where: { id: toBig(id) },
        select: { ai_prompt: true },
      });
      return v?.ai_prompt ?? null;
    }
    const i = await getPrisma().ngendev_images.findUnique({
      where: { id: toBig(id) },
      select: { ai_prompt: true },
    });
    return i?.ai_prompt ?? null;
  },

  filters: async (categoryId?: string): Promise<FilterItem[]> =>
    (
      await getPrisma().filter_ai_images.findMany({
        where: categoryId ? { category_id: toBig(categoryId) } : {},
        orderBy: bySort,
      })
    ).map((f) => ({
      id: f.id.toString(),
      categoryId: f.category_id.toString(),
      name: f.name ?? "Filter",
      image: resolveMedia(f.image_path),
      promptPreview: truncatePrompt(f.name ? `Reimagine the photo in ${f.name} style` : f.ai_prompt, 10),
    })),

  filterDetail: async (id: string): Promise<FilterItem | null> => {
    const f = await getPrisma().filter_ai_images.findUnique({ where: { id: toBig(id) } });
    return f
      ? {
          id: f.id.toString(),
          categoryId: f.category_id.toString(),
          name: f.name ?? "Filter",
          image: resolveMedia(f.image_path),
          promptPreview: truncatePrompt(
            f.name ? `Reimagine the photo in ${f.name} style` : f.ai_prompt,
            10,
          ),
        }
      : null;
  },

  filterPrompt: async (id: string): Promise<string | null> => {
    const f = await getPrisma().filter_ai_images.findUnique({
      where: { id: toBig(id) },
      select: { ai_prompt: true },
    });
    return f?.ai_prompt ?? null;
  },

  tools: async (): Promise<Tool[]> => {
    const rows = await getPrisma().aiTool.findMany({ where: visible, orderBy: { sortOrder: "asc" } });
    if (rows.length === 0) return fallbackTools();
    return rows.map((t) => ({
      id: t.id,
      toolKey: t.toolKey as ToolKey,
      name: t.name,
      description: t.description,
      beforeImage: resolveMedia(t.beforeImage),
      afterImage: resolveMedia(t.afterImage),
      coinCost: t.coinCost,
      requiresPro: t.requiresPro === 1,
      sortOrder: t.sortOrder,
    }));
  },

  toolByKey: async (key: string): Promise<Tool | null> => {
    const t = await getPrisma().aiTool.findUnique({ where: { toolKey: key } });
    if (!t) return fallbackTools().find((x) => x.toolKey === key) ?? null;
    return {
      id: t.id,
      toolKey: t.toolKey as ToolKey,
      name: t.name,
      description: t.description,
      beforeImage: resolveMedia(t.beforeImage),
      afterImage: resolveMedia(t.afterImage),
      coinCost: t.coinCost,
      requiresPro: t.requiresPro === 1,
      sortOrder: t.sortOrder,
    };
  },

  featuredVideos: async (): Promise<PromptListItem[]> =>
    (await getPrisma().ngendev_videos.findMany({ orderBy: bySort, take: 12 })).map((v) =>
      videoListItem(v as VideoRow),
    ),

  featuredImages: async (): Promise<PromptListItem[]> =>
    (await getPrisma().ngendev_images.findMany({ orderBy: bySort, take: 12 })).map((i) =>
      imageListItem(i as ImageRow),
    ),

  mosaic: async (): Promise<string[]> => {
    const [vids, imgs] = await Promise.all([
      getPrisma().ngendev_videos.findMany({ orderBy: bySort, take: 9 }),
      getPrisma().ngendev_images.findMany({ orderBy: bySort, take: 9 }),
    ]);
    return [
      ...vids.map((v) => resolveMedia((v as VideoRow).video_thumbnail ?? (v as VideoRow).video_path)),
      ...imgs.map((i) => resolveMedia((i as ImageRow).image_path)),
    ].filter((u): u is string => Boolean(u));
  },
};
