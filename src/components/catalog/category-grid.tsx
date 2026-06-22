import type { Category } from "@/lib/types";
import { CategoryCard } from "./category-card";
import { Reveal } from "@/components/ui/reveal";
import { EmptyState } from "@/components/ui/empty-state";

/** Responsive grid of category tiles, ordered by sort_order (§6). */
export function CategoryGrid({
  categories,
  hrefFor,
  emptyLabel = "Nothing here yet",
}: {
  categories: Category[];
  hrefFor: (c: Category) => string;
  emptyLabel?: string;
}) {
  if (categories.length === 0) {
    return <EmptyState title={emptyLabel} hint="Check back soon — new drops land every week." />;
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((c, i) => (
        <Reveal key={c.id} delay={Math.min(i, 8) * 0.03}>
          <CategoryCard category={c} href={hrefFor(c)} priority={i < 4} />
        </Reveal>
      ))}
    </div>
  );
}
