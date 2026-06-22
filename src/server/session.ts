import "server-only";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/** Require a signed-in user in a server component; redirect to login otherwise. */
export async function requireUserId(next: string): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect(`/login?next=${encodeURIComponent(next)}`);
  return id;
}
