import type { Metadata } from "next";
import { catalog } from "@/data/catalog";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/catalog/page-hero";
import { CategoryGrid } from "@/components/catalog/category-grid";

export const metadata: Metadata = {
  title: "AI Video Prompts",
  description: "Browse cinematic AI video prompt categories. Unlock, copy, and generate motion.",
};

export default async function VideosPage() {
  const categories = await catalog.videoCategories();
  return (
    <>
      <PageHero
        eyebrow="Browse"
        title="AI Video Prompts"
        subtitle="Cinematic motion prompts, organized by vibe. Pick a collection to dive in."
      />
      <Container className="py-10">
        <CategoryGrid categories={categories} hrefFor={(c) => `/videos/${c.id}`} />
      </Container>
    </>
  );
}
