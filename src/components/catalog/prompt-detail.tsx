import { Clapperboard, ImageIcon, Layers } from "lucide-react";
import type { PromptDetail, PromptListItem } from "@/lib/types";
import { Container } from "@/components/layout/container";
import { Breadcrumb } from "./breadcrumb";
import { PreviewStage } from "./preview-stage";
import { PromptPanel } from "./prompt-panel";
import { SectionHeader } from "./section-header";
import { Rail } from "./rail";
import { PromptCard } from "./prompt-card";

/** Prompt detail (§6). Locked by default — full prompt only when `unlocked`. */
export function PromptDetailView({
  item,
  categoryName,
  categoryHref,
  rootHref,
  rootLabel,
  recommended,
  favorited = false,
}: {
  item: PromptDetail;
  categoryName: string;
  categoryHref: string;
  rootHref: string;
  rootLabel: string;
  recommended: PromptListItem[];
  favorited?: boolean;
}) {
  const KindIcon = item.kind === "video" ? Clapperboard : ImageIcon;

  return (
    <>
      <Container className="py-8">
        <Breadcrumb
          items={[
            { href: rootHref, label: rootLabel },
            { href: categoryHref, label: categoryName },
            { label: item.hint ?? "Prompt" },
          ]}
        />

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div className="self-start lg:sticky lg:top-24">
            <PreviewStage item={item} />
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="font-display text-h1 font-semibold text-hi">
                {item.hint ?? categoryName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 font-mono text-caption text-mid">
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-hairline px-2.5 py-1">
                  <KindIcon className="h-3.5 w-3.5" />
                  {item.kind === "video" ? "Video prompt" : "Photo prompt"}
                </span>
                {item.count > 1 && (
                  <span className="inline-flex items-center gap-1.5 rounded-pill border border-hairline px-2.5 py-1">
                    <Layers className="h-3.5 w-3.5" />
                    {item.count} variations
                  </span>
                )}
              </div>
            </div>

            <PromptPanel item={item} favorited={favorited} />
          </div>
        </div>
      </Container>

      {recommended.length > 0 && (
        <Container className="pb-16">
          <SectionHeader title="Recommended" subtitle="More from this collection" />
          <Rail>
            {recommended.map((r) => (
              <PromptCard key={r.id} item={r} />
            ))}
          </Rail>
        </Container>
      )}
    </>
  );
}
