import { catalog } from "@/data/catalog";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/catalog/page-hero";
import { CategoryGrid } from "@/components/catalog/category-grid";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "AI Photo Prompts",
  description: "Browse editorial AI photo prompt categories. Unlock, copy, and generate stills.",
  path: "/images",
});

export default async function ImagesPage() {
  const categories = await catalog.imageCategories();
  return (
    <>
      <PageHero
        eyebrow="Browse"
        title="AI Photo Prompts"
        subtitle="Editorial stills, organized by style. Pick a collection to dive in."
      />
      <Container className="py-10">
        <CategoryGrid categories={categories} hrefFor={(c) => `/images/${c.id}`} />
      </Container>
    </>
  );
}
