import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { requireUserId } from "@/server/session";
import { resolveFavorites } from "@/server/favorites";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/catalog/page-hero";
import { Breadcrumb } from "@/components/catalog/breadcrumb";
import { EmptyState } from "@/components/ui/empty-state";
import { PromptCard } from "@/components/catalog/prompt-card";
import { FilterCard } from "@/components/catalog/filter-card";
import { buttonClass } from "@/components/ui/button-variants";

export const metadata: Metadata = { title: "Favorites" };

export default async function FavoritesPage() {
  const userId = await requireUserId("/account/favorites");
  const favorites = await resolveFavorites(userId);

  return (
    <>
      <PageHero
        title="Favorites"
        subtitle="Prompts, filters and tools you've saved."
        top={<Breadcrumb items={[{ href: "/account", label: "Account" }, { label: "Favorites" }]} />}
      />
      <Container className="py-10">
        {favorites.length === 0 ? (
          <EmptyState
            title="No favorites yet"
            hint="Tap the heart on any prompt or filter to save it here."
            icon={<Heart className="h-8 w-8" />}
            action={
              <Link href="/images" className={buttonClass({ variant: "primary", size: "sm" })}>
                Browse prompts
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {favorites.map((f) =>
              f.kind === "prompt" ? (
                <PromptCard key={f.favId} item={f.item} />
              ) : (
                <FilterCard key={f.favId} filter={f.item} />
              ),
            )}
          </div>
        )}
      </Container>
    </>
  );
}
