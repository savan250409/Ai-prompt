import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUserId } from "@/server/session";
import { getViewer, isPromptUnlocked } from "@/server/entitlements";
import { catalog } from "@/data/catalog";
import { config } from "@/lib/config";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/catalog/page-hero";
import { Breadcrumb } from "@/components/catalog/breadcrumb";
import { GenerateClient } from "@/components/studio/generate-client";

export const metadata: Metadata = { title: "Generate Image" };

export default async function GenerateImagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUserId(`/images/prompt/${id}/generate`);
  if (!(await isPromptUnlocked("image", id))) {
    redirect(`/images/prompt/${id}`);
  }
  const item = await catalog.imageDetail(id, true);
  if (!item) notFound();
  const viewer = await getViewer();

  return (
    <>
      <PageHero
        title="Generate Image"
        subtitle={item.hint ?? "Create from this prompt."}
        top={
          <Breadcrumb
            items={[
              { href: "/images", label: "Images" },
              { href: `/images/prompt/${item.id}`, label: "Prompt" },
              { label: "Generate" },
            ]}
          />
        }
      />
      <Container className="py-10">
        <GenerateClient
          kind="image"
          promptId={item.id}
          cost={config.coinCost.image}
          isPro={viewer.isPro}
          durations={[...config.video.durations]}
          resolutions={[...config.video.resolutions]}
        />
      </Container>
    </>
  );
}
