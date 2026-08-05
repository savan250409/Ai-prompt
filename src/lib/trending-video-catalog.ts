import type { Category, PromptDetail, PromptListItem } from "@/lib/types";

let cacheTime = 0;
let cachedPrompts: any[] = [];

export async function fetchTrendingVideoScrapedData() {
  const now = Date.now();
  // Cache for 30 minutes in memory
  if (cachedPrompts.length > 0 && now - cacheTime < 30 * 60 * 1000) {
    return cachedPrompts;
  }

  try {
    const res = await fetch("https://youmind.com/prompts/video", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) throw new Error("Failed to fetch landing video presets page");

    const html = await res.text();

    // 1. Combine next_f pushes WITHOUT unescaping first
    const pushRegex = /self\.__next_f\.push\(\[1,\s*"([\s\S]*?)"\]\)/g;
    let rawPayload = "";
    let match;
    while ((match = pushRegex.exec(html)) !== null) {
      rawPayload += match[1];
    }

    // 2. Parse block definitions on rawPayload using hex regex
    const blocks: Record<string, string> = {};
    const blockHeaderRegex = /([0-9a-fA-F]+):T([0-9a-fA-F]+),/g;
    let headerMatch;
    while ((headerMatch = blockHeaderRegex.exec(rawPayload)) !== null) {
      const id = headerMatch[1];
      const hexLen = headerMatch[2];
      const len = parseInt(hexLen, 16);
      const contentStart = headerMatch.index + headerMatch[0].length;
      
      let content = rawPayload.substr(contentStart, len);
      
      // Unescape javascript and JSON escapes
      content = content
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t');
        
      try {
        content = JSON.parse('"' + content.replace(/"/g, '\\"') + '"');
      } catch (e) {}
      
      blocks[id] = content;
    }

    // Parse short strings
    const shortStringRegex = /([0-9a-fA-F]+):"([^"]+)"/g;
    let shortMatch;
    while ((shortMatch = shortStringRegex.exec(rawPayload)) !== null) {
      let content = shortMatch[2]
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t');
      blocks[shortMatch[1]] = content;
    }

    // Unescape rawPayload for finding prompt objects
    const decodedPayload = rawPayload
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t');

    const results: any[] = [];
    const seenIds = new Set<number>();
    let pos = 0;
    let idx = 0;
    while ((pos = decodedPayload.indexOf('{"prompt":{"id":', pos)) !== -1) {
      let braceCount = 1;
      let end = pos + 1;
      let inString = false;
      let escaped = false;
      
      while (braceCount > 0 && end < decodedPayload.length) {
        const char = decodedPayload[end];
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

      const objStr = decodedPayload.substring(pos, end);
      pos = end;
      
      try {
        const parentObj = JSON.parse(objStr);
        const obj = parentObj.prompt;
        if (obj && obj.title) {
          if (seenIds.has(obj.id)) {
            continue;
          }
          seenIds.add(obj.id);
          let promptText = obj.content ?? "";
          if (promptText.startsWith('$')) {
            const refId = promptText.substring(1);
            if (blocks[refId]) {
              promptText = blocks[refId];
            }
          }

          if (!promptText || promptText.length < 20) {
            promptText = `A hyper-detailed, high-fidelity AI video prompt for "${obj.title}". Preserving motion continuity, realistic details, cinematic lighting, and realistic camera physics.`;
          }

          const videoUrl = obj.videos && obj.videos[0] ? obj.videos[0].sourceUrl : "";
          const thumbnail = obj.videos && obj.videos[0] ? obj.videos[0].thumbnail : (obj.media && obj.media[0] ? obj.media[0] : "");

          results.push({
            id: `tr-v-${idx + 1}`,
            rawId: String(idx + 1),
            title: obj.title,
            category: "AI Video Prompts • Cinematic",
            imgSrc: thumbnail,
            videoUrl: videoUrl,
            badge: String(idx + 1).padStart(2, "0"),
            promptText,
          });
          idx++;
        }
      } catch (e) {}
    }

    if (results.length > 0) {
      cachedPrompts = results;
      cacheTime = now;
    }

    return results;
  } catch (err) {
    console.error("Error fetching trending video preset data:", err);
    return cachedPrompts;
  }
}

export const TRENDING_VIDEO_CATEGORY: Category = {
  id: "trending-video-prompts",
  name: "AI Video Prompts",
  image: "https://pbs.twimg.com/amplify_video_thumb/2083357221883158528/img/8ImctZNgvJG1G2Qz.jpg",
  sortOrder: 0,
};

export async function getTrendingVideoListItems(): Promise<PromptListItem[]> {
  const data = await fetchTrendingVideoScrapedData();
  return data.map((item) => ({
    id: item.id,
    kind: "video",
    categoryId: "trending-video-prompts",
    thumbnail: item.imgSrc,
    preview: item.videoUrl, // serves as the hover video preview URL
    hint: item.title,
    aspect: 0.72, // standard video aspect ratio
    count: 1,
    exclusive: false,
  }));
}

export async function getTrendingVideoPromptDetail(
  id: string,
  unlocked: boolean = true
): Promise<PromptDetail | null> {
  const data = await fetchTrendingVideoScrapedData();
  const item = data.find((d) => d.id === id || d.rawId === id);
  if (!item) return null;

  return {
    id: item.id,
    kind: "video",
    categoryId: "trending-video-prompts",
    thumbnail: item.imgSrc,
    preview: item.videoUrl,
    hint: item.title,
    aspect: 0.72,
    count: 1,
    exclusive: false,
    promptPreview: item.promptText,
    prompt: item.promptText,
    unlocked: unlocked,
    aiModel: item.model || "Seedance 2.5",
    nameChange: false,
  };
}
