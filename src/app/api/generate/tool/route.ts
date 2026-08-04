import { runGeneration } from "@/server/generation";
import { validateImageDataUri } from "@/lib/upload";
import { ok, fail } from "@/lib/http";
import type { ToolKey } from "@/lib/types";

export const dynamic = "force-dynamic";

const TOOL_KEYS: ToolKey[] = [
  "image_generation",
  "image_enhancer",
  "bg_remover",
  "bg_changer",
  "retouch",
  "old_to_new",
];

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    toolKey?: string;
    prompt?: string;
    image?: string;
    aspect?: string;
    method?: "ad" | "coins";
  } | null;

  const toolKey = body?.toolKey as ToolKey | undefined;
  if (!toolKey || !TOOL_KEYS.includes(toolKey)) return fail(400, "Unknown tool");
  const upload = validateImageDataUri(body?.image);
  if (upload.error) return fail(400, upload.error);

  const result = await runGeneration({
    kind: "tool",
    toolKey,
    prompt: body?.prompt,
    sourceImage: upload.value,
    aspect: body?.aspect,
    method: body?.method === "coins" ? "coins" : "ad",
  });
  if (!result.ok) return fail(result.status, result.error);
  return ok(result);
}
