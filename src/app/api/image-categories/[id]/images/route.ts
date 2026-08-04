import { catalog } from "@/data/catalog";
import { ok, parsePaging } from "@/lib/http";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { skip, take } = parsePaging(req.url);
  const { id } = await params;
  const items = await catalog.imagesByCategory(id, { skip, take });
  return ok({ items, nextSkip: items.length === take ? skip + take : null });
}
