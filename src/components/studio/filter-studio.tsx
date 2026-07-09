"use client";

import { useEffect, useState } from "react";
import { ReferencePreview } from "./reference-preview";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Coins, Wand2 } from "lucide-react";
import type { FilterItem } from "@/lib/types";
import { UploadDropzone } from "./upload-dropzone";
import { SummonResult } from "./summon-result";
import { useGeneration } from "./use-generation";
import { AspectPicker } from "./aspect-picker";
import { Button } from "@/components/ui/button";
import { useSession, selectIsPro } from "@/store/session";
import { fileToDataUri } from "@/lib/file";
import { saveDraft, takeDraft, dataUriToFile } from "@/lib/draft";
import { IMAGE_ASPECTS } from "@/lib/aspects";

/** Filter studio — upload a photo, apply the style via image-to-image (§6, §7a). */
export function FilterStudio({ filter, coinCost }: { filter: FilterItem; coinCost: number }) {
  const router = useRouter();
  const me = useSession((s) => s.me);
  const isPro = useSession(selectIsPro);
  const [file, setFile] = useState<File | null>(null);
  const [aspect, setAspect] = useState("1:1");
  const { state, result, run, reset } = useGeneration();

  // Restore an upload saved before a sign-in redirect (so it isn't lost).
  useEffect(() => {
    const draft = takeDraft(`filter:${filter.id}`);
    if (draft?.image) dataUriToFile(draft.image).then(setFile).catch(() => {});
  }, [filter.id]);

  async function apply() {
    if (!file) return toast.info("Upload a photo to apply this style.");
    if (!me?.authenticated) {
      saveDraft(`filter:${filter.id}`, { image: await fileToDataUri(file) });
      toast.info("Sign in to apply filters.");
      return router.push(`/login?next=/filters/${filter.id}`);
    }
    const image = await fileToDataUri(file);
    await run(
      "/api/generate/filter",
      { filterId: filter.id, image, aspect },
      { cost: coinCost, mediaKind: "image" },
    );
  }

  function aspectRatio(a: string): number {
    const [w, h] = a.split(":").map(Number);
    return w && h ? w / h : 1;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <ReferencePreview label="Style sample" name={filter.name} image={filter.image} />

      <div className="min-w-0 space-y-5">
        <p className="text-caption font-medium uppercase tracking-wide text-low">Your photo</p>
        {state === "idle" ? (
          <>
            <UploadDropzone value={file} onChange={setFile} />

            <div className="space-y-2">
              <AspectPicker
                name="filter-aspect"
                value={aspect}
                onChange={setAspect}
                lockedValues={isPro ? [] : IMAGE_ASPECTS.slice(1)}
                onLocked={() => toast.info("Unlock all aspect ratios with Pro.")}
              />
              {!isPro && (
                <Link href="/pricing" className="inline-flex min-h-6 items-center text-caption text-gold hover:underline">
                  Unlock all aspect ratios with Pro →
                </Link>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-hairline px-3 py-1.5 font-mono text-caption text-hi">
                <Coins className="h-3.5 w-3.5 text-gold" />
                {coinCost} coins · or Pro
              </span>
              <Button onClick={apply} disabled={!file}>
                <Wand2 className="h-4 w-4" />
                Apply filter
              </Button>
            </div>
          </>
        ) : (
          <SummonResult state={state} result={result} onReset={reset} ratio={aspectRatio(aspect)} />
        )}
      </div>
    </div>
  );
}
