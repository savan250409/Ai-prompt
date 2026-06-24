import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalog } from "@/data/catalog";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/catalog/page-hero";
import { Breadcrumb } from "@/components/catalog/breadcrumb";
import { PromptMasonry } from "@/components/catalog/prompt-masonry";
import { pluralize } from "@/lib/utils";

const TAKE = 9;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}): Promise<Metadata> {
  const { categoryId } = await params;
  const cats = await catalog.imageCategories();
  const category = cats.find((c) => c.id === categoryId);
  return { title: category ? category.name : "Photo Prompts" };
}

export default async function ImageCategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const [cats, items] = await Promise.all([
    catalog.imageCategories(),
    catalog.imagesByCategory(categoryId, { skip: 0, take: TAKE }),
  ]);
  const category = cats.find((c) => c.id === categoryId);
  if (!category) notFound();

  const nextSkip = items.length === TAKE ? TAKE : null;

  return (
    <>
      <PageHero
        title={category.name}
        subtitle={`${category.type ? category.type + " · " : ""}${pluralize(
          category.count ?? items.length,
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
