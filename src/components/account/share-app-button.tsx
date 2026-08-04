"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

export function ShareAppButton() {
  async function share() {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Prompt Studio", text: "Create with AI prompts", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      /* dismissed */
    }
  }
  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-2 text-caption text-mid transition-colors hover:text-hi"
    >
      <Share2 className="h-4 w-4" />
      Share app
    </button>
  );
}
