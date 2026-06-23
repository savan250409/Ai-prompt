import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

/**
 * Local media API — serves the catalog's *_path / *_image files for dev.
 *
 * The DB stores bare filenames (e.g. `tttt1.webp`, `16.mp4`). This route looks
 * them up in a local media folder (MEDIA_LOCAL_DIR, default `<project>/media`)
 * and streams the bytes. If the file isn't there yet, an IMAGE request falls
 * back to the generated SVG placeholder so the UI never shows a broken box; a
 * VIDEO request 404s (the player falls back to its thumbnail).
 *
 * Going live needs NO code change: set MEDIA_BASE_URL to your real CDN and the
 * catalog resolves straight to it, bypassing this route entirely.
 */

const MEDIA_DIR = process.env.MEDIA_LOCAL_DIR
  ? path.resolve(process.env.MEDIA_LOCAL_DIR)
  : path.join(process.cwd(), "media");

const MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

const IMAGE_EXT = new Set([".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".avif"]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await params;
  const rel = (parts ?? []).join("/");
  const ext = path.extname(rel).toLowerCase();

  // Resolve safely inside MEDIA_DIR (block path traversal).
  const abs = path.resolve(MEDIA_DIR, rel);
  if (!abs.startsWith(MEDIA_DIR)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let data: Buffer | null = null;
  try {
    data = await fs.readFile(abs);
  } catch {
    data = null;
  }

  // Miss: images get a placeholder, videos 404 (UI shows the thumbnail).
  if (!data) {
    if (IMAGE_EXT.has(ext)) {
      const seed = encodeURIComponent(rel.replace(/[^a-z0-9]/gi, "") || "media");
      return NextResponse.redirect(new URL(`/api/placeholder/${seed}/800/1100`, req.url));
    }
    return new NextResponse("Not found", { status: 404 });
  }

  const contentType = MIME[ext] ?? "application/octet-stream";
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=3600",
  };

  // Range support so <video> can stream/seek.
  const range = req.headers.get("range");
  if (range && contentType.startsWith("video/")) {
    const m = /bytes=(\d+)-(\d*)/.exec(range);
    if (m) {
      const start = Number(m[1]);
      const end = m[2] ? Number(m[2]) : data.length - 1;
      const chunk = data.subarray(start, end + 1);
      return new NextResponse(chunk as unknown as BodyInit, {
        status: 206,
        headers: {
          ...headers,
          "Accept-Ranges": "bytes",
          "Content-Range": `bytes ${start}-${end}/${data.length}`,
          "Content-Length": String(chunk.length),
        },
      });
    }
  }

  return new NextResponse(data as unknown as BodyInit, {
    status: 200,
    headers: {
      ...headers,
      "Accept-Ranges": "bytes",
      "Content-Length": String(data.length),
    },
  });
}
