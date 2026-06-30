import type { MetadataRoute } from "next";
import { isNoindexHost } from "@/lib/config";

const BASE = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  // On a staging/dev host, block crawling entirely (§audit 5).
  if (isNoindexHost()) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/account", "/api"] }],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
