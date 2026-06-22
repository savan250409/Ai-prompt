"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Coins, Wand2 } from "lucide-react";
import type { FilterItem } from "@/lib/types";
import { UploadDropzone } from "./upload-dropzone";
import { SummonResult } from "./summon-result";
import { useGeneration } from "./use-generation";
import { Button } from "@/components/ui/button";
import { useSession } from "@/store/session";
import { fileToDataUri } from "@/lib/file";

/** Filter studio — upload a photo, apply the style via image-to-image (§6, §7a). */
export function FilterStudio({ filter, coinCost }: { filter: FilterItem; coinCost: number }) {
  const router = useRouter();
  const me = useSession((s) => s.me);
  const [file, setFile] = useState<File | null>(null);
  const { state, result, run, reset } = useGeneration();

  async function apply() {
    if (!file) return toast.info("Upload a photo to apply this style.");
    if (!me?.authenticated) {
      toast.info("Sign in to apply filters.");
      return router.push(`/login?next=/filters/${filter.id}`);
    }
    const image = await fileToDataUri(file);
    await run("/api/generate/filter", { filterId: filter.id, image }, { cost: coinCost, mediaKind: "image" });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <p className="mb-2 text-caption font-medium uppercase tracking-wide text-low">Style sample</p>
        <div className="relative aspect-square overflow-hidden rounded-card border border-hairline bg-surface-2">
          {filter.image && (
            <Image src={filter.image} alt={filter.name} fill sizes="(max-width:768px) 100vw, 40vw" className="object-cover" />
          )}
          <div className="media-scrim absolute inset-0" />
          <span className="absolute bottom-3 left-3 rounded-pill bg-black/45 px-2.5 py-1 text-caption text-white/90 backdrop-blur-sm">
            {filter.name}
          </span>
        </div>
      </div>

      <div className="space-y-5">
        <p className="text-caption font-medium uppercase tracking-wide text-low">Your photo</p>
        {state === "idle" ? (
          <>
            <UploadDropzone value={file} onChange={setFile} />
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
          <SummonResult state={state} result={result} onReset={reset} ratio={1} />
        )}
      </div>
    </div>
  );
}
