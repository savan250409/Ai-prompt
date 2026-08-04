import { catalog } from "@/data/catalog";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/catalog/page-hero";
import { Breadcrumb } from "@/components/catalog/breadcrumb";
import { PromptCard } from "@/components/catalog/prompt-card";
import { pluralize } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "New AI Photo Prompt Examples — Prompt Studio",
  description:
    "Explore live AI photo prompt examples for portraits and selfies directly from our trending presets.",
  path: "/images/trending-prompts",
});

export default async function TrendingPromptsCategoryPage() {
  const items = await catalog.imagesByCategory("trending-prompts");
  const total = items.length;

  return (
    <>
      <PageHero
        title="New AI Photo Prompt Examples"
        subtitle={`${pluralize(total, "photo prompt")}`}
        top={<Breadcrumb items={[{ href: "/images", label: "Images" }, { label: "New AI Photo Prompt Examples" }]} />}
      />
      <Container className="py-10">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
          {items.map((item, idx) => (
            <PromptCard key={item.id} item={item} priority={idx < 4} />
          ))}
        </div>
      </Container>
    </>
  );
}
