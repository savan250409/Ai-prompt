import { runGeneration } from "@/server/generation";
import { validateImageDataUri } from "@/lib/upload";
import { ok, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    filterId?: string;
    image?: string;
  } | null;

  if (!body?.filterId) return fail(400, "Missing filter");
  const upload = validateImageDataUri(body.image);
  if (upload.error) return fail(400, upload.error);

  const result = await runGeneration({
    kind: "filter",
    sourceItemType: null,
    sourceItemId: body.filterId,
    sourceImage: upload.value,
  });
  if (!result.ok) return fail(result.status, result.error);
  return ok(result);
}
