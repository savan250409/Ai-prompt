"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Sparkles } from "lucide-react";
import type { PromptDetail } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PromptBlock } from "./prompt-block";
import { UnlockDialog } from "./unlock-dialog";
import { CopyButton, FavoriteButton, ShareButton } from "./prompt-social";
import { promptHref } from "./prompt-card";
import { useSession, selectIsPro } from "@/store/session";
import { track } from "@/lib/analytics";

/**
 * Owns the unlock lifecycle on the detail page (§6, §7):
 * locked preview -> Unlock (Pro instant / dialog) -> server unlock -> reveal.
 * Entitlement is enforced server-side; this only reflects the result.
 */
export function PromptPanel({
  item,
  favorited = false,
}: {
  item: PromptDetail;
  favorited?: boolean;
}) {
  const router = useRouter();
  const me = useSession((s) => s.me);
  const isPro = useSession(selectIsPro);
  const freeRemaining = useSession((s) => s.me?.freeUnlocksRemaining ?? 0);
  const localUnlocked = useSession((s) => s.isUnlocked(item.kind, item.id));
  const markUnlocked = useSession((s) => s.markUnlocked);
  const decFreeUnlocks = useSession((s) => s.decFreeUnlocks);

  const [prompt, setPrompt] = useState<string | null>(item.prompt);
  const [unlocked, setUnlocked] = useState(item.unlocked);
  const [reveal, setReveal] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const isUnlocked = unlocked || item.unlocked || (localUnlocked && prompt != null);

  async function doUnlock(method: "pro" | "ad") {
    setBusy(true);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType: item.kind, itemId: item.id, method }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          toast.info("Sign in to unlock prompts.");
          router.push(`/login?next=${encodeURIComponent(promptHref(item))}`);
          return;
        }
        toast.error(data.error ?? "Couldn't unlock — try again.");
        return;
      }
      const data = (await res.json()) as { prompt: string; method: "pro" | "ad" };
      setPrompt(data.prompt);
      setUnlocked(true);
      setReveal(true);
      setDialogOpen(false);
      markUnlocked(item.kind, item.id);
      if (data.method === "ad") decFreeUnlocks();
      track("prompt_unlock", { kind: item.kind, method: data.method });
      toast.success("Reward Granted — Prompt Unlocked Successfully");
    } finally {
      setBusy(false);
    }
  }

  function onUnlockClick() {
    if (!me?.authenticated) {
      toast.info("Create a free account to unlock prompts.");
      router.push(`/login?next=${encodeURIComponent(promptHref(item))}`);
      return;
    }
    if (isPro) {
      void doUnlock("pro");
      return;
    }
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <PromptBlock
        preview={item.promptPreview}
        prompt={prompt}
        unlocked={Boolean(isUnlocked)}
        reveal={reveal}
      />

      <div className="flex flex-wrap items-center gap-2.5">
        {isUnlocked ? (
          <>
            <CopyButton text={prompt ?? ""} />
            <Button
              variant="secondary"
              onClick={() => router.push(`${promptHref(item)}/generate`)}
            >
              <Sparkles className="h-4 w-4" />
              Generate {item.kind === "video" ? "Video" : "Image"}
            </Button>
          </>
        ) : (
          <Button onClick={onUnlockClick} loading={busy}>
            <Lock className="h-4 w-4" />
            Unlock Prompt
          </Button>
        )}
        <FavoriteButton item={item} initialFavorited={favorited} />
        <ShareButton item={item} />
      </div>

      {!isUnlocked && (
        <p className="text-caption text-mid">
          Unlock without ads by upgrading to Pro, or watch an ad to continue for free.
        </p>
      )}

      <UnlockDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        freeRemaining={freeRemaining}
        unlocking={busy}
        onBuyPro={() => router.push("/pricing")}
        onWatchAd={() => doUnlock("ad")}
      />
    </div>
  );
}
