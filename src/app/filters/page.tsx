import type { Metadata } from "next";
import Link from "next/link";
import { catalog } from "@/data/catalog";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/catalog/page-hero";
import { SectionHeader } from "@/components/catalog/section-header";
import { FilterCard } from "@/components/catalog/filter-card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "AI Filters",
  description: "Turn any photo into a style — Ghibli, Pixar 3D, Anime, Pop Art and more.",
};

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
        eyebrow="AI Filter"
        title="Filters"
        subtitle="Upload a photo and reimagine it in any style in seconds."
      />
      <Container className="space-y-10 py-10">
        <div className="flex flex-wrap gap-2">
          {chip("/filters", "All", !selected)}
          {cats.map((c) => chip(`/filters?category=${c.id}`, c.name, selected === c.id))}
        </div>

        {filters.length === 0 ? (
          <EmptyState title="No filters here yet" hint="More styles are on the way." />
        ) : selected ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {filters.map((f, i) => (
              <FilterCard key={f.id} filter={f} priority={i < 6} />
            ))}
          </div>
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
