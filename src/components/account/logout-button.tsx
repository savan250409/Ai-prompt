"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/store/session";

export function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const reset = useSession((s) => s.reset);

  async function logout() {
    await signOut({ redirect: false });
    reset();
    await queryClient.invalidateQueries({ queryKey: ["me"] });
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="inline-flex items-center gap-2 rounded-pill border border-hairline px-4 py-2 text-sm font-medium text-mid transition-colors hover:border-danger/40 hover:text-danger"
    >
      <LogOut className="h-4 w-4" />
      Log out
    </button>
  );
}
