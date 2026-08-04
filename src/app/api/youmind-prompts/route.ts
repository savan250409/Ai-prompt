import { NextResponse } from "next/server";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const res = await fetch("https://youmind.com/landing/photo-prompt", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch from YouMind: ${res.status}`);
    }

    const html = await res.text();

    const articleRegex = /<article[\s\S]*?<\/article>/g;
    const articleMatches = [...html.matchAll(articleRegex)];

    const prompts = articleMatches.map((match, idx) => {
      const articleHtml = match[0];

      // Title
      const titleMatch = articleHtml.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
      const title = titleMatch ? titleMatch[1].trim() : `AI Photo Prompt #${idx + 1}`;

      // Category / Description
      const descMatch = articleHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/);
      const category = descMatch
        ? descMatch[1].trim().replace(/&amp;/g, "&")
        : "Portrait / Selfie • Photography";

      // Image URL
      let imgSrc = "";
      const cmsMatch = articleHtml.match(/https%3A%2F%2Fcms-assets\.youmind\.com%2Fmedia%2F[a-zA-Z0-9_\-\.]+/);
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

      // Badge
      const badge = String(idx + 1).padStart(2, "0");

      // Generate a detailed, realistic prompt text based on the title & category
      const promptText = `A hyper-detailed, high-fidelity AI photo prompt for "${title}". (${category}). Preserving facial structure, authentic skin details, cinematic lighting, and realistic depth of field. Designed for portrait and selfie enhancement.`;

      return {
        id: idx + 1,
        title,
        category,
        imgSrc: imgSrc || "/cdn-cgi/image/width=640,quality=90,format=auto/https://cms-assets.youmind.com/media/1785654872281_yitryr_HOqLfg0XQAA9fNU.jpg",
        badge,
        promptText,
      };
    });

    return NextResponse.json({
      success: true,
      count: prompts.length,
      prompts,
    });
  } catch (error: any) {
    console.error("Error in youmind-prompts API route:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch prompts" },
      { status: 500 }
    );
  }
}
