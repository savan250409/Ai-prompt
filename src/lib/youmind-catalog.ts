import type { Category, PromptDetail, PromptListItem } from "@/lib/types";

let cacheTime = 0;
let cachedPrompts: any[] = [];

export async function fetchYoumindScrapedData() {
  const now = Date.now();
  // Cache for 30 minutes in memory
  if (cachedPrompts.length > 0 && now - cacheTime < 30 * 60 * 1000) {
    return cachedPrompts;
  }

  try {
    const res = await fetch("https://youmind.com/landing/photo-prompt", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) throw new Error("Failed to fetch YouMind page");

    const html = await res.text();
    const articleRegex = /<article[\s\S]*?<\/article>/g;
    const articleMatches = [...html.matchAll(articleRegex)];

    const unescapedHtml = html
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\")
      .replace(/\\n/g, "\n");

    const results = articleMatches.map((match, idx) => {
      const articleHtml = match[0];
      const titleMatch = articleHtml.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
      const title = titleMatch ? titleMatch[1].trim() : `AI Photo Prompt #${idx + 1}`;

      const descMatch = articleHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/);
      const category = descMatch
        ? descMatch[1].trim().replace(/&amp;/g, "&")
        : "Portrait / Selfie • Photography";

      let imgSrc = "";
      const cmsMatch = articleHtml.match(
        /https%3A%2F%2Fcms-assets\.youmind\.com%2Fmedia%2F[a-zA-Z0-9_\-\.]+/
      );
      if (cmsMatch) {
        imgSrc = decodeURIComponent(cmsMatch[0]);
      } else {
        const srcMatch = articleHtml.match(/src="([^"]+)"/);
        if (srcMatch) {
          let s = srcMatch[1];
          if (s.includes("https%3A%2F%2F")) {
            s = decodeURIComponent(s);
            const pos = s.indexOf("https://");
            if (pos !== -1) s = s.substring(pos);
          }
          imgSrc = s;
        }
      }

      if (!imgSrc) {
        imgSrc =
          "https://cms-assets.youmind.com/media/1785654872281_yitryr_HOqLfg0XQAA9fNU.jpg";
      }

      const badge = String(idx + 1).padStart(2, "0");

      // Extract prompt text
      let promptText = "";
      const titlePos = unescapedHtml.indexOf(title);
      if (titlePos !== -1) {
        const chunk = unescapedHtml.substring(titlePos, titlePos + 2500);
        const textMatches = chunk.match(
          /(?:Transform|Use|Create|A photo|A portrait|Using|A hyper-detailed|An AI|Photorealistic)[^"<>]{30,800}/gi
        );
        if (textMatches && textMatches.length > 0) {
          promptText = textMatches.sort((a, b) => b.length - a.length)[0].trim();
        }
      }

      if (!promptText || promptText.length < 20) {
        promptText = `A hyper-detailed, high-fidelity AI photo prompt for "${title}". (${category}). Preserving facial structure, authentic skin details, cinematic lighting, and realistic depth of field. Designed for portrait and selfie enhancement.`;
      }

      return {
        id: `ym-${idx + 1}`,
        rawId: String(idx + 1),
        title,
        category,
        imgSrc,
        badge,
        promptText,
      };
    });

    if (results.length > 0) {
      cachedPrompts = results;
      cacheTime = now;
    }

    return results;
  } catch (err) {
    console.error("Error fetching YouMind data:", err);
    return cachedPrompts;
  }
}

export const YOUMIND_CATEGORY: Category = {
  id: "youmind-prompts",
  name: "New AI Photo Prompt Examples",
  type: "Solo",
  image: "https://cms-assets.youmind.com/media/1785654872281_yitryr_HOqLfg0XQAA9fNU.jpg",
  sortOrder: 0,
};

export async function getYoumindListItems(): Promise<PromptListItem[]> {
  const data = await fetchYoumindScrapedData();
  return data.map((item) => ({
    id: item.id,
    kind: "image",
    categoryId: "youmind-prompts",
    thumbnail: item.imgSrc,
    preview: null,
    hint: item.title,
    aspect: 0.75,
    count: 1,
    exclusive: false,
  }));
}

export async function getYoumindPromptDetail(
  id: string,
  unlocked: boolean = true
): Promise<PromptDetail | null> {
  const data = await fetchYoumindScrapedData();
  const item = data.find((d) => d.id === id || d.rawId === id);
  if (!item) return null;

  return {
    id: item.id,
    kind: "image",
    categoryId: "youmind-prompts",
    thumbnail: item.imgSrc,
    preview: null,
    hint: item.title,
    aspect: 0.75,
    count: 1,
    exclusive: false,
    promptPreview: item.promptText,
    prompt: item.promptText,
    unlocked: unlocked,
    aiModel: "Nano Banana Pro",
    nameChange: false,
  };
}
