import { catalog } from "@/data/catalog";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/catalog/page-hero";
import { SectionHeader } from "@/components/catalog/section-header";
import { Rail } from "@/components/catalog/rail";
import { PromptCard } from "@/components/catalog/prompt-card";
import { FilterCard } from "@/components/catalog/filter-card";
import { ToolCard } from "@/components/catalog/tool-card";
import { Reveal } from "@/components/ui/reveal";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Explore",
  description:
    "Browse AI photo prompts, video prompts, filters, and creative tools — unlock, copy, and generate.",
  path: "/explore",
});

/** Explore — the hero's "Explore prompts" destination. One screen, four rows:
 *  photos · videos · filters · tools, each linking through to its full section. */
export default async function ExplorePage() {
  const [images, videos, filters, tools] = await Promise.all([
    catalog.featuredImages(),
    catalog.featuredVideos(),
    catalog.filters(),
    catalog.tools(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Explore"
        title="Everything in one place"
        subtitle="Photo prompts, video prompts, filters, and AI tools — pick a row and dive in."
      />

      <Container className="space-y-16 pb-16 pt-4 md:space-y-20 md:pb-20">
        {/* row 1 — photo prompts */}
        {images.length > 0 && (
          <Reveal>
            <section>
              <SectionHeader
                title="AI Photo Prompts"
                subtitle="Editorial stills, one tap to unlock"
                seeAllHref="/images"
              />
              <Rail>
                {images.map((item, i) => (
                  <PromptCard key={item.id} item={item} priority={i < 2} />
                ))}
              </Rail>
            </section>
          </Reveal>
        )}

        {/* row 2 — video prompts */}
        {videos.length > 0 && (
          <Reveal>
            <section>
              <SectionHeader
                title="AI Video Prompts"
                subtitle="Cinematic motion, ready to generate"
                seeAllHref="/videos"
              />
              <Rail>
                {videos.map((item) => (
                  <PromptCard key={item.id} item={item} />
                ))}
              </Rail>
            </section>
          </Reveal>
        )}

        {/* row 3 — filters */}
        {filters.length > 0 && (
          <Reveal>
            <section>
              <SectionHeader
                title="AI Filters"
                subtitle="Turn any photo into a style"
                seeAllHref="/filters"
              />
              <Rail slideClassName="basis-[40%] sm:basis-[26%] md:basis-[20%] lg:basis-[15%]">
                {filters.slice(0, 14).map((filter) => (
                  <FilterCard key={filter.id} filter={filter} />
                ))}
              </Rail>
            </section>
          </Reveal>
        )}

        {/* row 4 — AI tools */}
        {tools.length > 0 && (
          <Reveal>
            <section>
              <SectionHeader
                title="AI Tools"
                subtitle="Generate, enhance, and transform your photos"
                seeAllHref="/tools"
              />
              <Rail slideClassName="basis-[78%] sm:basis-[52%] md:basis-[38%] lg:basis-[30%]">
                {tools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </Rail>
            </section>
          </Reveal>
        )}
      </Container>
    </>
  );
}
