import { catalog } from "@/data/catalog";
import { Container } from "@/components/layout/container";
import { MosaicHero } from "@/components/catalog/mosaic-hero";
import { Rail } from "@/components/catalog/rail";
import { PromptCard } from "@/components/catalog/prompt-card";
import { FilterCard } from "@/components/catalog/filter-card";
import { SectionHeader } from "@/components/catalog/section-header";
import { ProSpotlight } from "@/components/catalog/pro-spotlight";
import { Reveal } from "@/components/ui/reveal";
import { JsonLd } from "@/components/seo/json-ld";

const SITE = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export default async function HomePage() {
  const [mosaic, videos, images, filters] = await Promise.all([
    catalog.mosaic(),
    catalog.featuredVideos(),
    catalog.featuredImages(),
    catalog.filters(),
  ]);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "Organization", "@id": `${SITE}/#org`, name: "Prompt Studio", url: SITE },
            {
              "@type": "WebSite",
              "@id": `${SITE}/#website`,
              name: "Prompt Studio",
              url: SITE,
              description:
                "Thousands of cinematic AI photo & video prompts, filters, and creative tools.",
              publisher: { "@id": `${SITE}/#org` },
            },
          ],
        }}
      />
      <MosaicHero images={mosaic} />

      <Container className="space-y-16 pb-16 pt-10 md:space-y-20 md:pb-20 md:pt-12">
        <Reveal>
          <section>
            <SectionHeader
              title="AI Video Prompts"
              subtitle="Cinematic motion, ready to generate"
              seeAllHref="/videos"
            />
            <Rail>
              {videos.map((v, i) => (
                // prioritize the first cards: one is the mobile LCP element
                <PromptCard key={v.id} item={v} priority={i < 2} />
              ))}
            </Rail>
          </section>
        </Reveal>

        <Reveal>
          <ProSpotlight />
        </Reveal>

        <Reveal>
          <section>
            <SectionHeader
              title="AI Photo Prompts"
              subtitle="Editorial stills, one tap to unlock"
              seeAllHref="/images"
            />
            <Rail>
              {images.map((v) => (
                <PromptCard key={v.id} item={v} />
              ))}
            </Rail>
          </section>
        </Reveal>

        <Reveal>
          <section>
            <SectionHeader
              title="AI Filters"
              subtitle="Turn any photo into a style"
              seeAllHref="/filters"
            />
            <Rail>
              {filters.slice(0, 12).map((f, i) => (
                <FilterCard key={f.id} filter={f} priority={i < 4} />
              ))}
            </Rail>
          </section>
        </Reveal>
      </Container>
    </>
  );
}
