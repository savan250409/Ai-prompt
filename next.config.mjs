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
    remotePatterns: [
      // mock/seed placeholders (§1 — runs before a real CDN is set)
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
      // real media via MEDIA_BASE_URL (§1.7)
      ...mediaPattern(),
    ],
  },
  // server-only secrets never reach the client; nothing exported here on purpose.
  eslint: {
    // keep dev unblocked; CI lint is run separately
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
