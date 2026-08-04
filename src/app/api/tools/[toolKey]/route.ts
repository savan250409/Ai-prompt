import { catalog } from "@/data/catalog";
import { ok, fail } from "@/lib/http";

export async function GET(_req: Request, { params }: { params: Promise<{ toolKey: string }> }) {
  const { toolKey } = await params;
  const tool = await catalog.toolByKey(toolKey);
  if (!tool) return fail(404, "Tool not found");
  return ok(tool);
}
