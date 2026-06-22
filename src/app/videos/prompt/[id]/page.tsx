import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalog } from "@/data/catalog";
import { getViewer, isPromptUnlocked } from "@/server/entitlements";
import { store } from "@/server/store";
import { PromptDetailView } from "@/components/catalog/prompt-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await catalog.videoDetail(id, false);
  if (!item) return { title: "Video Prompt" };
  return { title: item.hint ?? "Video Prompt", description: item.promptPreview };
}

export default async function VideoPromptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unlocked = await isPromptUnlocked("video", id);
  const item = await catalog.videoDetail(id, unlocked);
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
