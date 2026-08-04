import { getViewer } from "@/server/entitlements";
import { store } from "@/server/store";
import { toGenerationDto } from "@/server/generation";
import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";

/** The current user's generations (My Media) — §8. */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer.userId) return ok({ generations: [] });
  const gens = await store.generations.listForUser(viewer.userId);
  return ok({ generations: gens.map(toGenerationDto) });
}
