import { catalog } from "@/data/catalog";
import { ok, fail } from "@/lib/http";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const filter = await catalog.filterDetail(id);
  if (!filter) return fail(404, "Filter not found");
  return ok(filter);
}
