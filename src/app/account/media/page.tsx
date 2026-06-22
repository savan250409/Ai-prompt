import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { requireUserId } from "@/server/session";
import { store } from "@/server/store";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/catalog/page-hero";
import { Breadcrumb } from "@/components/catalog/breadcrumb";
import { EmptyState } from "@/components/ui/empty-state";
import { MyMediaGrid } from "@/components/account/my-media-grid";
import { buttonClass } from "@/components/ui/button-variants";

export const metadata: Metadata = { title: "My Media" };

export default async function MyMediaPage() {
  const userId = await requireUserId("/account/media");
  const generations = await store.generations.listForUser(userId);

  return (
    <>
      <PageHero
        title="My Media"
        subtitle="Everything you've generated, in one place."
        top={<Breadcrumb items={[{ href: "/account", label: "Account" }, { label: "My Media" }]} />}
      />
      <Container className="py-10">
        {generations.length === 0 ? (
          <EmptyState
            title="No media yet"
            hint="Generate an image or video and it'll show up here."
            icon={<Sparkles className="h-8 w-8" />}
            action={
              <Link href="/tools" className={buttonClass({ variant: "primary", size: "sm" })}>
                Explore tools
              </Link>
            }
          />
        ) : (
          <MyMediaGrid
            items={generations.map((g) => ({
              id: g.id,
              kind: g.kind,
              status: g.status,
              outputMediaPath: g.outputMediaPath,
              inputMediaPath: g.inputMediaPath,
              coinsSpent: g.coinsSpent,
              params: g.params,
              createdAt: g.createdAt.toISOString(),
            }))}
          />
        )}
      </Container>
    </>
  );
}
