import { catalog } from "@/data/catalog";
import { Container } from "@/components/layout/container";
import { MosaicHero } from "@/components/catalog/mosaic-hero";
import { Rail } from "@/components/catalog/rail";
import { PromptCard } from "@/components/catalog/prompt-card";
import { CategoryCard } from "@/components/catalog/category-card";
import { SectionHeader } from "@/components/catalog/section-header";
import { ProSpotlight } from "@/components/catalog/pro-spotlight";
import { Reveal } from "@/components/ui/reveal";

export default async function HomePage() {
  const [mosaic, videos, images, filterCats] = await Promise.all([
    catalog.mosaic(),
    catalog.featuredVideos(),
    catalog.featuredImages(),
    catalog.filterCategories(),
  ]);

  return (
    <>
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
              {videos.map((v) => (
                <PromptCard key={v.id} item={v} />
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {filterCats.slice(0, 3).map((c, i) => (
                <CategoryCard
                  key={c.id}
                  category={c}
                  href={`/filters?category=${c.id}`}
                  priority={i === 0}
                />
              ))}
            </div>
          </section>
        </Reveal>
      </Container>
    </>
  );
}
