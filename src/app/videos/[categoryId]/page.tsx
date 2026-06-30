import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalog } from "@/data/catalog";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/catalog/page-hero";
import { Breadcrumb } from "@/components/catalog/breadcrumb";
import { PromptMasonry } from "@/components/catalog/prompt-masonry";
import { pluralize } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";

const TAKE = 9;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}): Promise<Metadata> {
  const { categoryId } = await params;
  const cats = await catalog.videoCategories();
  const category = cats.find((c) => c.id === categoryId);
  if (!category) return { title: "Video Prompts" };
  return pageMetadata({
    title: category.name,
    description: `Browse ${category.name} AI video prompts — unlock the full prompt, copy it, and generate your own motion.`,
    path: `/videos/${categoryId}`,
  });
}

export default async function VideoCategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  // Full list so the header count is the REAL total, not the stale preview
  // count (§audit 3); same cached call for the live API source.
  const [cats, allItems] = await Promise.all([
    catalog.videoCategories(),
    catalog.videosByCategory(categoryId),
  ]);
  const category = cats.find((c) => c.id === categoryId);
  if (!category) notFound();

  const total = allItems.length;
  const items = allItems.slice(0, TAKE);
  const nextSkip = total > TAKE ? TAKE : null;

  return (
    <>
      <PageHero
        title={category.name}
        subtitle={`${category.type ? category.type + " · " : ""}${pluralize(
          total,
          "video prompt",
        )}`}
        top={<Breadcrumb items={[{ href: "/videos", label: "Videos" }, { label: category.name }]} />}
      />
      <Container className="py-10">
        <PromptMasonry
          kind="video"
          categoryId={category.id}
          initialItems={items}
          initialNextSkip={nextSkip}
        />
      </Container>
    </>
  );
}
