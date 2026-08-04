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
  const cats = await catalog.imageCategories();
  const category = cats.find((c) => c.id === categoryId);
  if (!category) return { title: "Photo Prompts" };
  return pageMetadata({
    title: category.name,
    description: `Browse ${category.name} AI photo prompts — unlock the full prompt, copy it, and generate your own stills.`,
    path: `/images/${categoryId}`,
  });
}

export default async function ImageCategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  // Fetch the full list so the header count is the REAL total, not the stale
  // preview-subset count from the category list (§audit 3). For the live API
  // source this is the same cached call (paging is just a local slice).
  const [cats, allItems] = await Promise.all([
    catalog.imageCategories(),
    catalog.imagesByCategory(categoryId),
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
          "photo prompt",
        )}`}
        top={<Breadcrumb items={[{ href: "/images", label: "Images" }, { label: category.name }]} />}
      />
      <Container className="py-10">
        <PromptMasonry
          kind="image"
          categoryId={category.id}
          initialItems={items}
          initialNextSkip={nextSkip}
        />
      </Container>
    </>
  );
}
