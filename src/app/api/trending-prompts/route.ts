import { NextResponse } from "next/server";
import { fetchTrendingScrapedData } from "@/lib/trending-catalog";

export const revalidate = 1800; // Cache for 30 minutes (matches scraper)

export async function GET() {
  try {
    const rawPrompts = await fetchTrendingScrapedData();
    
    // Map items to match the numeric ID expected by the client component
    const prompts = rawPrompts.map((item) => ({
      id: Number(item.rawId),
      title: item.title,
      category: item.category,
      imgSrc: item.imgSrc,
      badge: item.badge,
      promptText: item.promptText,
    }));

    return NextResponse.json({
      success: true,
      count: prompts.length,
      prompts,
    });
  } catch (error: any) {
    console.error("Error in trending-prompts API route:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch prompts" },
      { status: 500 }
    );
  }
}
