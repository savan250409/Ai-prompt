import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalog } from "@/data/catalog";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/catalog/page-hero";
import { Breadcrumb } from "@/components/catalog/breadcrumb";
import { ToolStudio } from "@/components/studio/tool-studio";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ toolKey: string }>;
}): Promise<Metadata> {
  const { toolKey } = await params;
  const tool = await catalog.toolByKey(toolKey);
  return { title: tool ? tool.name : "AI Tool", description: tool?.description };
}

export default async function ToolDetailPage({ params }: { params: Promise<{ toolKey: string }> }) {
  const { toolKey } = await params;
  const tool = await catalog.toolByKey(toolKey);
  if (!tool) notFound();

  return (
    <>
      <PageHero
        title={tool.name}
        subtitle={tool.description}
        top={<Breadcrumb items={[{ href: "/tools", label: "AI Tools" }, { label: tool.name }]} />}
      />
      <Container className="py-10">
        <ToolStudio tool={tool} />
      </Container>
    </>
  );
}
