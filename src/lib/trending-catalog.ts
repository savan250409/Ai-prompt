import type { Category, PromptDetail, PromptListItem } from "@/lib/types";

let cacheTime = 0;
let cachedPrompts: any[] = [];

export async function fetchTrendingScrapedData() {
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

    if (!res.ok) throw new Error("Failed to fetch landing presets page");

    const html = await res.text();

    // 1. Extract and combine all next_f pushes
    const pushRegex = /self\.__next_f\.push\(\[1,\s*"([\s\S]*?)"\]\)/g;
    let rawPayload = "";
    let match;
    while ((match = pushRegex.exec(html)) !== null) {
      let chunk = match[1];
      // Unescape JavaScript string literal
      chunk = chunk
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t');
      rawPayload += chunk;
    }

    // 2. Extract string block definitions: ID:T[hex_length],[content] or ID:"[content]"
    const blocks: Record<string, string> = {};
    const blockHeaderRegex = /(\d+):T([0-9a-fA-F]+),/g;
    let headerMatch;
    while ((headerMatch = blockHeaderRegex.exec(rawPayload)) !== null) {
      const id = headerMatch[1];
      const hexLen = headerMatch[2];
      const len = parseInt(hexLen, 16);
      const contentStart = headerMatch.index + headerMatch[0].length;
      let content = rawPayload.substr(contentStart, len);
      try {
        content = JSON.parse('"' + content.replace(/"/g, '\\"') + '"');
      } catch (e) {}
      blocks[id] = content;
    }

    // Also parse string blocks like: ID:"content"
    const shortStringRegex = /(\d+):"([^"]+)"/g;
    let shortMatch;
    while ((shortMatch = shortStringRegex.exec(rawPayload)) !== null) {
      blocks[shortMatch[1]] = shortMatch[2];
    }

    // 3. Find all prompt objects by scanning for `{"id":"cms-`
    const results: any[] = [];
    const seenIds = new Set<string>();
    let pos = 0;
    let idx = 0;

    while ((pos = rawPayload.indexOf('{"id":"cms-', pos)) !== -1) {
      // Find the matching closing curly brace
      let braceCount = 1;
      let end = pos + 1;
      let inString = false;
      let escaped = false;
      
      while (braceCount > 0 && end < rawPayload.length) {
        const char = rawPayload[end];
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '"') {
          inString = !inString;
        } else if (!inString) {
          if (char === '{') braceCount++;
          else if (char === '}') braceCount--;
        }
        end++;
      }

      const objStr = rawPayload.substring(pos, end);
      pos = end; // advance position
      
      try {
        const obj = JSON.parse(objStr);
        if (obj.title && (obj.prompt || obj.imageUrl)) {
          if (seenIds.has(obj.id)) {
            continue;
          }
          seenIds.add(obj.id);
          let promptText = obj.prompt ?? "";
          if (promptText.startsWith('$')) {
            const refId = promptText.substring(1);
            if (blocks[refId]) {
              promptText = blocks[refId];
            }
          }

          if (!promptText || promptText.length < 20) {
            promptText = `A hyper-detailed, high-fidelity AI photo prompt for "${obj.title}". Preserving facial structure, authentic skin details, cinematic lighting, and realistic depth of field. Designed for portrait and selfie enhancement.`;
          }

          const category = obj.traits 
            ? obj.traits.split(' • ').slice(0, 2).join(' • ') 
            : "Portrait / Selfie • Photography";

          const imgSrc = obj.imageUrl ?? obj.imgSrc ?? "https://cms-assets.youmind.com/media/1785654872281_yitryr_HOqLfg0XQAA9fNU.jpg";
          const badge = String(idx + 1).padStart(2, "0");

          results.push({
            id: `tr-${idx + 1}`,
            rawId: String(idx + 1),
            title: obj.title,
            category,
            imgSrc,
            badge,
            promptText,
          });
          idx++;
        }
      } catch (e) {
        // Skip failed parse
      }
    }

    if (results.length > 0) {
      cachedPrompts = results;
      cacheTime = now;
    }

    return results;
  } catch (err) {
    console.error("Error fetching trending preset data:", err);
    return cachedPrompts;
  }
}

export const TRENDING_CATEGORY: Category = {
  id: "trending-prompts",
  name: "AI Photo Prompts",
  // type: "Solo",
  image: "https://cms-assets.youmind.com/media/1785654872281_yitryr_HOqLfg0XQAA9fNU.jpg",
  sortOrder: 0,
};

export async function getTrendingListItems(): Promise<PromptListItem[]> {
  const data = await fetchTrendingScrapedData();
  return data.map((item) => ({
    id: item.id,
    kind: "image",
    categoryId: "trending-prompts",
    thumbnail: item.imgSrc,
    preview: null,
    hint: item.title,
    aspect: 0.75,
    count: 1,
    exclusive: false,
  }));
}

export async function getTrendingPromptDetail(
  id: string,
  unlocked: boolean = true
): Promise<PromptDetail | null> {
  const data = await fetchTrendingScrapedData();
  const item = data.find((d) => d.id === id || d.rawId === id);
  if (!item) return null;

  return {
    id: item.id,
    kind: "image",
    categoryId: "trending-prompts",
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
