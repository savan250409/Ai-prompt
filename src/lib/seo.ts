import type { Metadata } from "next";
import type { PromptDetail } from "@/lib/types";

/** First clean clause of a longer text, for titles/headings. */
function snippet(text: string | null | undefined, max = 64): string | null {
  if (!text) return null;
  const s = text
    // drop leaked template tokens so titles/links don't show "[****]" / "{name}"
    .replace(/[[{][^\]}]*[\]}]/g, " ")
    .replace(/[_*]{2,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return null;
  const clause = s.split(/[.,;:\n—–-]/)[0]?.trim() || s;
  return (clause.length > 8 ? clause : s).slice(0, max).trim();
}

/** A unique, descriptive name for a prompt — its hint, else a prompt snippet. */
export function promptDisplayName(
  item: Pick<PromptDetail, "hint" | "promptPreview" | "kind">,
  id: string,
): string {
  return (
    item.hint?.trim() ||
    snippet(item.promptPreview) ||
    `${item.kind === "video" ? "Video" : "Photo"} Prompt ${id}`
  );
}

/**
 * A short, readable, ad-safe lede shown on the prompt page so it has unique
 * VISIBLE (and indexable) content even while the full copyable prompt stays
 * gated — §audit 4. Derived from the ad-safe preview, template tokens stripped.
 */
export function promptLede(
  item: Pick<PromptDetail, "promptPreview" | "kind" | "hint">,
): string {
  const clean = (item.promptPreview ?? "")
    .replace(/[[{][^\]}]*[\]}]/g, " ")
    .replace(/[_*]{2,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const kindWord = item.kind === "video" ? "AI video prompt" : "AI photo prompt";
  if (clean.length >= 24) {
    const firstSentence = clean.split(/(?<=[.!?])\s+/)[0] ?? clean;
    const lede = (firstSentence.length > 24 ? firstSentence : clean)
      .slice(0, 180)
      .trim()
      .replace(/[.!?\s]+$/, "");
    return `${lede} — unlock to reveal and copy the full ${kindWord}, then generate your own.`;
  }
  const subject = item.hint ? `${item.hint}: ` : "";
  return `${subject}a cinematic ${kindWord}. Unlock to reveal the full prompt, copy it, and generate your own.`;
}

/**
 * Per-prompt metadata: unique title + description, a self-referencing canonical
 * (collapses the ?c= duplicates), and Open-Graph/Twitter cards that use the
 * prompt's own name + thumbnail so shared links preview correctly (§audit 1,2,6).
 */
export function promptMetadata(item: PromptDetail, id: string): Metadata {
  const name = promptDisplayName(item, id);
  const label = item.kind === "video" ? "AI Video Prompt" : "AI Photo Prompt";
  const title = `${name} — ${label}`;
  const description = (
    item.promptPreview?.replace(/\s+/g, " ").trim() ||
    `${name}. ${label} on Prompt Studio — unlock, copy, and generate.`
  ).slice(0, 160);
  const path = `/${item.kind === "video" ? "videos" : "images"}/prompt/${id}`;
  const images = item.thumbnail ? [item.thumbnail] : undefined;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: `${title} · Prompt Studio`,
      description,
      url: path,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · Prompt Studio`,
      description,
      images,
    },
  };
}

/**
 * Metadata for a static listing/marketing page: unique title, description, a
 * self-referencing canonical, and matching Open-Graph/Twitter cards so shared
 * links don't all fall back to the generic homepage card (§audit 1).
 */
export function pageMetadata(opts: {
  title: string;
  description?: string;
  path?: string;
}): Metadata {
  const { title, description, path } = opts;
  const ogTitle = `${title} · Prompt Studio`;
  return {
    title,
    description,
    ...(path ? { alternates: { canonical: path } } : {}),
    openGraph: {
      type: "website",
      title: ogTitle,
      description,
      ...(path ? { url: path } : {}),
    },
    twitter: { card: "summary_large_image", title: ogTitle, description },
  };
}

/**
 * Per-prompt JSON-LD (ImageObject for photo prompts, VideoObject for video
 * prompts) so the page gets rich-result eligibility instead of looking like a
 * duplicate, thin page (§audit 7). Built from the prompt's own name + media.
 */
export function promptJsonLd(item: PromptDetail, id: string): Record<string, unknown> {
  const name = promptDisplayName(item, id);
  const description =
    item.promptPreview?.replace(/\s+/g, " ").trim() ||
    `${name}. AI ${item.kind === "video" ? "video" : "photo"} prompt on Prompt Studio.`;

  if (item.kind === "video") {
    return {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name,
      description,
      ...(item.thumbnail ? { thumbnailUrl: item.thumbnail } : {}),
      ...(item.preview ? { contentUrl: item.preview } : {}),
    };
  }
  return {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    name,
    description,
    ...(item.thumbnail ? { contentUrl: item.thumbnail } : {}),
  };
}
