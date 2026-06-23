import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalog } from "@/data/catalog";
import { getViewer, isPromptUnlocked } from "@/server/entitlements";
import { store } from "@/server/store";
import { PromptDetailView } from "@/components/catalog/prompt-detail";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ c?: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { c } = await searchParams;
  const item = await catalog.videoDetail(id, false, c);
  if (!item) return { title: "Video Prompt" };
  return { title: item.hint ?? "Video Prompt", description: item.promptPreview };
}

export default async function VideoPromptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ c?: string }>;
}) {
  const { id } = await params;
  const { c } = await searchParams;
  const unlocked = await isPromptUnlocked("video", id);
  const item = await catalog.videoDetail(id, unlocked, c);
  if (!item) notFound();

  const viewer = await getViewer();
  const [cats, sameCat, favorited] = await Promise.all([
    catalog.videoCategories(),
    catalog.videosByCategory(item.categoryId, { skip: 0, take: 12 }),
    viewer.userId ? store.favorites.has(viewer.userId, "video", item.id) : Promise.resolve(false),
  ]);
  const category = cats.find((c) => c.id === item.categoryId);
  const recommended = sameCat.filter((r) => r.id !== item.id).slice(0, 10);

  return (
    <PromptDetailView
      item={item}
      categoryName={category?.name ?? "Videos"}
      categoryHref={`/videos/${item.categoryId}`}
      rootHref="/videos"
      rootLabel="Videos"
      recommended={recommended}
      favorited={favorited}
    />
  );
}
