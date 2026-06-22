import { catalog } from "@/data/catalog";
import { ok } from "@/lib/http";

export async function GET() {
  return ok(await catalog.videoCategories());
}
