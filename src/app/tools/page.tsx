import type { Metadata } from "next";
import { catalog } from "@/data/catalog";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/catalog/page-hero";
import { ToolCard } from "@/components/catalog/tool-card";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "AI Tools",
  description:
    "AI Image Generation, Enhancer, BG Remover, BG Changer, Retouch, and Old-to-New restoration.",
};

export default async function ToolsPage() {
  const tools = await catalog.tools();
  return (
    <>
      <PageHero
        eyebrow="AI Tools"
        title="Creative tools"
        subtitle="Generate, enhance, and transform your photos — powered by AI."
      />
      <Container className="py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t, i) => (
            <Reveal key={t.id} delay={Math.min(i, 6) * 0.04}>
              <ToolCard tool={t} priority={i < 3} />
            </Reveal>
          ))}
        </div>
      </Container>
    </>
  );
}
