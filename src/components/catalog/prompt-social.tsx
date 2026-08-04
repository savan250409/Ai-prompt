"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Heart, Share2 } from "lucide-react";
import type { PromptDetail } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useSession } from "@/store/session";
import { promptHref } from "./prompt-card";
import { cn } from "@/lib/utils";

/** Copy = checkmark morph + "Copied" (§11.6). */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Prompt copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy — select and copy manually.");
    }
  }
  return (
    <Button variant="primary" onClick={copy}>
      <span className="relative grid h-4 w-4 place-items-center">
        <Copy className={cn("absolute h-4 w-4 transition-all duration-base", copied && "scale-0 opacity-0")} />
        <Check
          className={cn(
            "absolute h-4 w-4 transition-all duration-base",
            copied ? "scale-100 opacity-100" : "scale-0 opacity-0",
          )}
        />
      </span>
      {copied ? "Copied" : "Copy Prompt"}
    </Button>
  );
}

export function FavoriteButton({
  item,
  initialFavorited = false,
}: {
  item: PromptDetail;
  initialFavorited?: boolean;
}) {
  const me = useSession((s) => s.me);
  const [fav, setFav] = useState(initialFavorited);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!me?.authenticated) {
      toast.info("Sign in to save favorites.");
      return;
    }
    const next = !fav;
    setFav(next); // optimistic
    setBusy(true);
    try {
      const res = next
        ? await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemType: item.kind, itemId: item.id }),
          })
        : await fetch(`/api/favorites/${item.kind}:${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      toast.success(next ? "Saved to favorites" : "Removed from favorites");
    } catch {
      setFav(!next); // revert
      toast.error("Couldn't update favorites.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      aria-pressed={fav}
      aria-label={fav ? "Remove from favorites" : "Add to favorites"}
      onClick={toggle}
      disabled={busy}
      className="grid h-11 w-11 place-items-center rounded-pill border border-hairline text-mid transition-all duration-base hover:bg-surface-2 hover:text-hi active:scale-95 disabled:opacity-60"
    >
      <Heart className={cn("h-5 w-5 transition-all", fav && "scale-110 fill-danger text-danger")} />
    </button>
  );
}

export function ShareButton({ item }: { item: PromptDetail }) {
  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : promptHref(item);
    const data = { title: "Prompt Studio", text: item.hint ?? "Check out this AI prompt", url };
    try {
      if (navigator.share) await navigator.share(data);
      else {
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
      aria-label="Share"
      onClick={share}
      className="grid h-11 w-11 place-items-center rounded-pill border border-hairline text-mid transition-all duration-base hover:bg-surface-2 hover:text-hi active:scale-95"
    >
      <Share2 className="h-5 w-5" />
    </button>
  );
}
