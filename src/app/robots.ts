import type { MetadataRoute } from "next";

const BASE = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/account", "/api"] }],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
