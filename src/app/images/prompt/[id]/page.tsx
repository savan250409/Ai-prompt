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
  const item = await catalog.imageDetail(id, false);
  if (!item) return { title: "Photo Prompt" };
  return { title: item.hint ?? "Photo Prompt", description: item.promptPreview };
}

export default async function ImagePromptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unlocked = await isPromptUnlocked("image", id);
  const item = await catalog.imageDetail(id, unlocked);
  if (!item) notFound();

  const viewer = await getViewer();
  const [cats, sameCat, favorited] = await Promise.all([
    catalog.imageCategories(),
    catalog.imagesByCategory(item.categoryId, { skip: 0, take: 12 }),
    viewer.userId ? store.favorites.has(viewer.userId, "image", item.id) : Promise.resolve(false),
  ]);
  const category = cats.find((c) => c.id === item.categoryId);
  const recommended = sameCat.filter((r) => r.id !== item.id).slice(0, 10);

  return (
    <PromptDetailView
      item={item}
      categoryName={category?.name ?? "Images"}
      categoryHref={`/images/${item.categoryId}`}
      rootHref="/images"
      rootLabel="Images"
      recommended={recommended}
      favorited={favorited}
    />
  );
}
