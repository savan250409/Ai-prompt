import { catalog } from "@/data/catalog";
import { ok } from "@/lib/http";

export async function GET(req: Request) {
  const categoryId = new URL(req.url).searchParams.get("category") ?? undefined;
  return ok(await catalog.filters(categoryId));
}
