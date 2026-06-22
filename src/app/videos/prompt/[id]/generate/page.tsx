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

export const metadata: Metadata = { title: "Generate Video" };

export default async function GenerateVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUserId(`/videos/prompt/${id}/generate`);
  if (!(await isPromptUnlocked("video", id))) {
    redirect(`/videos/prompt/${id}`);
  }
  const item = await catalog.videoDetail(id, true);
  if (!item) notFound();
  const viewer = await getViewer();

  return (
    <>
      <PageHero
        title="Generate Video"
        subtitle={item.hint ?? "Bring this prompt to life."}
        top={
          <Breadcrumb
            items={[
              { href: "/videos", label: "Videos" },
              { href: `/videos/prompt/${item.id}`, label: "Prompt" },
              { label: "Generate" },
            ]}
          />
        }
      />
      <Container className="py-10">
        <GenerateClient
          kind="video"
          promptId={item.id}
          cost={config.coinCost.video}
          isPro={viewer.isPro}
          durations={[...config.video.durations]}
          resolutions={[...config.video.resolutions]}
        />
      </Container>
    </>
  );
}
