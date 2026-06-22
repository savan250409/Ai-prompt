import bcrypt from "bcryptjs";
import { z } from "zod";
import { store } from "@/server/store";
import { ok, fail } from "@/lib/http";

const Body = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  email: z.string().email().max(160),
  password: z.string().min(8).max(200),
});

/** Email/password sign-up. Creates the user; the client then signs in (§3). */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return fail(400, "Invalid request body");
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return fail(422, "Check your details", {
      issues: parsed.error.issues.map((i) => i.message),
    });
  }
  const { name, email, password } = parsed.data;

  const existing = await store.users.findByEmail(email);
  if (existing) return fail(409, "An account with this email already exists.");

  const passwordHash = await bcrypt.hash(password, 10);
  await store.users.create({ email, name: name ?? null, passwordHash });

  return ok({ ok: true }, { status: 201 });
}
