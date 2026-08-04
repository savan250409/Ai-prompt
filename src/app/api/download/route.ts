import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * Same-origin download proxy. The browser's `download` attribute is ignored for
 * cross-origin URLs, so generated media (im.runware.ai) won't download directly.
 * This streams the file back with `Content-Disposition: attachment`, forcing a
 * real "Save" instead of opening the image in a tab.
 *
 * Only an allowlist of known media hosts is proxied (prevents this becoming an
 * open SSRF/proxy for arbitrary URLs).
 */
function allowedHosts(): Set<string> {
  const hosts = new Set<string>([
    "im.runware.ai", // generated images
    "vm.runware.ai", // generated videos
    "aiphotomaker.aivibecode.in", // catalog media
  ]);
  try {
    if (config.mediaBaseUrl) hosts.add(new URL(config.mediaBaseUrl).hostname);
  } catch {
    /* MEDIA_BASE_URL is a relative path (no host) — nothing to add */
  }
  return hosts;
}

function extFor(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("mp4")) return "mp4";
  if (contentType.includes("webm")) return "webm";
  return "jpg";
}

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("url");
  if (!raw) return new Response("Missing url", { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }
  if (target.protocol !== "https:" || !allowedHosts().has(target.hostname)) {
    return new Response("Forbidden host", { status: 403 });
  }

  const upstream = await fetch(target.toString(), { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    return new Response("Upstream error", { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  const base = target.pathname.split("/").pop()?.split(".")[0] || "prompt-studio";
  const filename = `${base}.${extFor(contentType)}`;

  return new Response(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
