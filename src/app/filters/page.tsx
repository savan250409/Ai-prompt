import Link from "next/link";
import { catalog } from "@/data/catalog";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/catalog/page-hero";
import { SectionHeader } from "@/components/catalog/section-header";
import { FilterCard } from "@/components/catalog/filter-card";
import { ProgressiveGrid } from "@/components/catalog/progressive-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "AI Filters",
  description: "Turn any photo into a style — Ghibli, Pixar 3D, Anime, Pop Art and more.",
  path: "/filters",
});

export default async function FiltersPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: selected } = await searchParams;
  const [cats, filters] = await Promise.all([
    catalog.filterCategories(),
    catalog.filters(selected),
  ]);

  // With only one (placeholder-looking) category, the tab row and per-category
  // grouping are redundant — show a single flat grid instead (§audit 8).
  const showCategories = cats.length > 1;

  const chip = (href: string, label: string, active: boolean) => (
    <Link
      key={href}
      href={href}
      className={cn(
        "rounded-pill border px-3.5 py-1.5 text-caption font-medium transition-colors duration-base",
        active
          ? "border-transparent bg-grad-electric text-on-electric shadow-glow"
          : "border-hairline text-mid hover:text-hi hover:bg-surface-2",
      )}
    >
      {label}
    </Link>
  );

  return (
    <>
      <PageHero
        title="AI Filters"
        subtitle="Upload a photo and reimagine it in any style in seconds."
      />
      <Container className="space-y-10 py-10">
        {showCategories && (
          <div className="flex flex-wrap gap-2">
            {chip("/filters", "All", !selected)}
            {cats.map((c) => chip(`/filters?category=${c.id}`, c.name, selected === c.id))}
          </div>
        )}

        {filters.length === 0 ? (
          <EmptyState title="No filters here yet" hint="More styles are on the way." />
        ) : selected || !showCategories ? (
          <ProgressiveGrid
            step={9}
            className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6"
          >
            {filters.map((f, i) => (
              <FilterCard key={f.id} filter={f} priority={i < 6} />
            ))}
          </ProgressiveGrid>
        ) : (
          cats.map((c) => {
            const items = filters.filter((f) => f.categoryId === c.id);
            if (items.length === 0) return null;
            return (
              <section key={c.id}>
                <SectionHeader title={c.name} seeAllHref={`/filters?category=${c.id}`} />
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {items.map((f) => (
                    <FilterCard key={f.id} filter={f} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </Container>
    </>
  );
}
