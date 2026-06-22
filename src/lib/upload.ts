/**
 * Server-side upload validation (§10). Accepts an image data URI (JPG/PNG/WebP)
 * under the size cap. Returns the value or an error message.
 * TODO(§10): strip EXIF server-side (needs an image lib like sharp).
 */
const MAX_DATA_URI = 17_000_000; // ~12MB image encoded as base64
const ALLOWED = /^data:image\/(jpeg|png|webp);base64,/;

export function validateImageDataUri(v: unknown): { value?: string; error?: string } {
  if (v == null || v === "") return {};
  if (typeof v !== "string" || !ALLOWED.test(v)) {
    return { error: "Use a JPG, PNG or WebP image." };
  }
  if (v.length > MAX_DATA_URI) {
    return { error: "Image is too large (max 12MB)." };
  }
  return { value: v };
}
