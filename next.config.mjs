/** @type {import('next').NextConfig} */

// Resolve the MEDIA_BASE_URL host so next/image can optimize real catalog media.
function mediaPattern() {
  const base = process.env.MEDIA_BASE_URL;
  if (!base) return [];
  try {
    const u = new URL(base);
    return [{ protocol: u.protocol.replace(":", ""), hostname: u.hostname }];
  } catch {
    return [];
  }
}

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  images: {
    // Optimizer ON: resize to display size + serve AVIF/WebP. The catalog CDN
    // is server-reachable, so this cuts image bytes ~5-8x vs. full-size files.
    dangerouslyAllowSVG: true, // placeholder route serves SVG
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400, // cache optimized variants 24h
    remotePatterns: [
      // live upstream catalog API media (aivibecode)
      { protocol: "https", hostname: "aiphotomaker.aivibecode.in" },
      // mock/seed real photos (picsum is network-blocked here; loremflickr works)
      { protocol: "https", hostname: "loremflickr.com" },
      { protocol: "https", hostname: "*.staticflickr.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // real media via MEDIA_BASE_URL (§1.7)
      ...mediaPattern(),
    ],
  },
};

export default nextConfig;
