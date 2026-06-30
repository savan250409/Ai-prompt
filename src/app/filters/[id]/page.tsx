import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalog } from "@/data/catalog";
import { config } from "@/lib/config";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/catalog/page-hero";
import { Breadcrumb } from "@/components/catalog/breadcrumb";
import { FilterStudio } from "@/components/studio/filter-studio";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const filter = await catalog.filterDetail(id);
  if (!filter) return { title: "Filter" };
  return pageMetadata({
    title: `${filter.name} filter`,
    description: `Turn any photo into the ${filter.name} style — upload a photo and apply this AI filter in seconds.`,
    path: `/filters/${id}`,
  });
}

export default async function FilterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const filter = await catalog.filterDetail(id);
  if (!filter) notFound();

  return (
    <>
      <PageHero
        title={filter.name}
        subtitle="Upload a photo and reimagine it in this style."
        top={<Breadcrumb items={[{ href: "/filters", label: "Filters" }, { label: filter.name }]} />}
      />
      <Container className="py-10">
        <FilterStudio filter={filter} coinCost={config.coinCost.filter} />
      </Container>
    </>
  );
}
