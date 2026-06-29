"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import type { Tool } from "@/lib/types";
import { UploadDropzone } from "./upload-dropzone";
import { SummonResult } from "./summon-result";
import { ToolPayDialog } from "./tool-pay-dialog";
import { useGeneration } from "./use-generation";
import { Segmented } from "@/components/ui/segmented";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession, selectIsPro } from "@/store/session";
import { fileToDataUri } from "@/lib/file";
import { IMAGE_ASPECTS } from "@/lib/aspects";
import { saveDraft, takeDraft, dataUriToFile } from "@/lib/draft";

// Tools that produce a fresh image honor an aspect ratio; enhancer/bg-remover
// just transform the input, so they don't.
const ASPECT_TOOLS = new Set(["image_generation", "bg_changer", "retouch", "old_to_new"]);

/** Tool studio (§6, §7a). image_generation is text-to-image; rest take a photo. */
export function ToolStudio({ tool }: { tool: Tool }) {
  const router = useRouter();
  const me = useSession((s) => s.me);
  const isPro = useSession(selectIsPro);
  const coins = useSession((s) => s.me?.coins ?? 0);
  const [file, setFile] = useState<File | null>(null);
  const [inputPreview, setInputPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("1:1");
  const [showPay, setShowPay] = useState(false);
  const { state, result, run, reset } = useGeneration();
  const needsUpload = tool.toolKey !== "image_generation";
  // Tools where the user types a prompt: text-to-image, and BG Changer (the
  // user describes the new background to drop their photo into).
  const needsPrompt = tool.toolKey === "image_generation" || tool.toolKey === "bg_changer";
  const supportsAspect = ASPECT_TOOLS.has(tool.toolKey);
  const resultRatio = supportsAspect ? aspectRatio(aspect) : 1;

  // Preview of the uploaded photo, kept visible through generation + result.
  useEffect(() => {
    if (!file) {
      setInputPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setInputPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Restore an upload/prompt saved before a sign-in redirect (so it isn't lost).
  useEffect(() => {
    const draft = takeDraft(`tool:${tool.toolKey}`);
    if (!draft) return;
    if (draft.prompt) setPrompt(draft.prompt);
    if (draft.aspect) setAspect(draft.aspect);
    if (draft.image) dataUriToFile(draft.image).then(setFile).catch(() => {});
  }, [tool.toolKey]);

  // Validate inputs + auth. Pro → generate (coins) directly; free → ask how to
  // pay (watch ad for free, or use coins).
  async function onGenerateClick() {
    if (needsUpload && !file) return toast.info("Upload a photo to continue.");
    if (needsPrompt && !prompt.trim()) {
      return toast.info(
        tool.toolKey === "bg_changer" ? "Describe the new background." : "Describe what you'd like to generate.",
      );
    }
    if (!me?.authenticated) {
      // Persist the upload/prompt so it survives the sign-in round-trip.
      saveDraft(`tool:${tool.toolKey}`, {
        image: file ? await fileToDataUri(file) : undefined,
        prompt: needsPrompt ? prompt : undefined,
        aspect: supportsAspect ? aspect : undefined,
      });
      toast.info("Sign in to use this tool.");
      return router.push(`/login?next=/tools/${tool.toolKey}`);
    }
    if (isPro) void doGenerate("coins");
    else setShowPay(true);
  }

  async function doGenerate(method: "ad" | "coins") {
    setShowPay(false);
    const body: Record<string, unknown> = { toolKey: tool.toolKey, method };
    if (needsUpload && file) body.image = await fileToDataUri(file);
    if (needsPrompt) body.prompt = prompt;
    if (supportsAspect) body.aspect = aspect;
    // Pro and the "coins" choice spend coins; "watch ad" is free.
    const cost = isPro || method === "coins" ? tool.coinCost : 0;
    await run("/api/generate/tool", body, { cost, mediaKind: "image" });
  }

  return (
    <div className={state === "idle" ? "mx-auto max-w-xl" : "mx-auto max-w-3xl"}>
      <div className="space-y-5">
        {state === "idle" ? (
          <>
            {needsUpload && <UploadDropzone value={file} onChange={setFile} />}

            {needsPrompt && (
              <div>
                <p className="mb-2 text-caption font-medium uppercase tracking-wide text-low">
                  {tool.toolKey === "bg_changer" ? "New background" : "Prompt"}
                </p>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={tool.toolKey === "bg_changer" ? 3 : 5}
                  placeholder={
                    tool.toolKey === "bg_changer"
                      ? "A sunny tropical beach at golden hour, palm trees…"
                      : "A neon-lit street at night, cinematic, 35mm…"
                  }
                  className="w-full resize-y rounded-input border border-hairline bg-surface-2 p-3.5 font-mono text-sm text-hi placeholder:text-low focus-visible:border-cyan focus-visible:outline-none"
                />
              </div>
            )}

            {supportsAspect && (
              <div className="space-y-2">
                <Segmented
                  name="tool-aspect"
                  label="Aspect ratio"
                  options={IMAGE_ASPECTS.map((a) => ({ value: a, label: a }))}
                  value={aspect}
                  onChange={setAspect}
                  lockedValues={isPro ? [] : IMAGE_ASPECTS.slice(1)}
                  onLocked={() => toast.info("Unlock all aspect ratios with Pro.")}
                />
                {!isPro && (
                  <Link href="/pricing" className="block text-caption text-gold hover:underline">
                    Unlock all aspect ratios with Pro →
                  </Link>
                )}
              </div>
            )}

            <Button variant="primary" className="w-full" onClick={onGenerateClick}>
              <Sparkles className="h-4 w-4" />
              Generate
            </Button>
          </>
        ) : inputPreview ? (
          // Show the user's uploaded photo next to the generating/finished result.
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-caption font-medium uppercase tracking-wide text-low">Your photo</p>
              <div className="relative aspect-square overflow-hidden rounded-card border border-hairline bg-surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={inputPreview} alt="Your upload" className="h-full w-full object-cover" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-caption font-medium uppercase tracking-wide text-low">Result</p>
              <SummonResult state={state} result={result} onReset={reset} ratio={resultRatio} />
            </div>
          </div>
        ) : (
          <SummonResult state={state} result={result} onReset={reset} ratio={resultRatio} />
        )}
      </div>

      <ToolPayDialog
        open={showPay}
        onClose={() => setShowPay(false)}
        toolName={tool.name}
        coinCost={tool.coinCost}
        coins={coins}
        onWatchAd={() => void doGenerate("ad")}
        onUseCoins={() => void doGenerate("coins")}
      />
    </div>
  );
}

function aspectRatio(a: string): number {
  const [w, h] = a.split(":").map(Number);
  return w && h ? w / h : 1;
}
