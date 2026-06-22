import { getViewer } from "@/server/entitlements";
import { pollGeneration, toGenerationDto } from "@/server/generation";
import { ok, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Poll a generation's status (advances async tasks) — §8. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer.userId) return fail(401, "Sign in first.");
  const { id } = await params;
  const gen = await pollGeneration(id, viewer.userId);
  if (!gen) return fail(404, "Generation not found");
  return ok(toGenerationDto(gen));
}
