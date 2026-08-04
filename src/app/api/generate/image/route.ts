import { runGeneration } from "@/server/generation";
import { validateImageDataUri } from "@/lib/upload";
import { ok, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    sourceItemId?: string;
    prompt?: string;
    image?: string;
    aspect?: string;
  } | null;

  const upload = validateImageDataUri(body?.image);
  if (upload.error) return fail(400, upload.error);

  const result = await runGeneration({
    kind: "image",
    sourceItemType: body?.sourceItemId ? "image" : null,
    sourceItemId: body?.sourceItemId ?? null,
    prompt: body?.prompt,
    sourceImage: upload.value,
    aspect: body?.aspect,
  });
  if (!result.ok) return fail(result.status, result.error);
  return ok(result);
}
