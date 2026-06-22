import type { MetadataRoute } from "next";
import { catalog } from "@/data/catalog";

const BASE = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [videoCats, imageCats, filterCats, tools] = await Promise.all([
    catalog.videoCategories(),
    catalog.imageCategories(),
    catalog.filterCategories(),
    catalog.tools(),
  ]);

  const staticPaths = [
    "",
    "/videos",
    "/images",
    "/filters",
    "/tools",
    "/pricing",
    "/support",
    "/feedback",
    "/privacy",
    "/terms",
  ];

  const entries: MetadataRoute.Sitemap = [
    ...staticPaths.map((p) => ({
      url: `${BASE}${p}`,
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : 0.7,
    })),
    ...videoCats.map((c) => ({ url: `${BASE}/videos/${c.id}`, priority: 0.6 })),
    ...imageCats.map((c) => ({ url: `${BASE}/images/${c.id}`, priority: 0.6 })),
    ...filterCats.map((c) => ({ url: `${BASE}/filters?category=${c.id}`, priority: 0.4 })),
    ...tools.map((t) => ({ url: `${BASE}/tools/${t.toolKey}`, priority: 0.5 })),
  ];

  return entries;
}
