"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Coins, Sparkles } from "lucide-react";
import { UploadDropzone } from "./upload-dropzone";
import { SummonResult } from "./summon-result";
import { useGeneration } from "./use-generation";
import { Segmented } from "@/components/ui/segmented";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useSession } from "@/store/session";
import { fileToDataUri } from "@/lib/file";
import { videoCoinCost } from "@/lib/config";
import { IMAGE_ASPECTS } from "@/lib/aspects";

function aspectRatio(a: string): number {
  const [w, h] = a.split(":").map(Number);
  return w && h ? w / h : 1;
}

/** Generate from an unlocked prompt — image (img2img optional) or video (i2v). */
export function GenerateClient({
  kind,
  promptId,
  cost,
  isPro,
  durations,
  resolutions,
}: {
  kind: "video" | "image";
  promptId: string;
  cost: number;
  isPro: boolean;
  durations: number[];
  resolutions: number[];
}) {
  const coins = useSession((s) => s.me?.coins ?? 0);
  const [file, setFile] = useState<File | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [aspect, setAspect] = useState("1:1");
  const [duration, setDuration] = useState(durations[0]);
  const [resolution, setResolution] = useState(resolutions[0]);
  const { state, result, run, reset } = useGeneration();

  // Capture the uploaded photo as a data URI the MOMENT it's selected, and hold
  // it in state. Generation then reads this snapshot — it never depends on the
  // File object (or its preview) still being live at click time, so the source
  // photo can't be "lost" between upload and Generate.
  useEffect(() => {
    if (!file) {
      setImageData(null);
      return;
    }
    let active = true;
    fileToDataUri(file)
      .then((d) => {
        if (active) setImageData(d);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [file]);

  // Bytedance outputs portrait video; image uses the chosen aspect ratio.
  const ratio = kind === "video" ? 9 / 16 : aspectRatio(aspect);

  // Video price scales with resolution + duration; image is the flat prop cost.
  const effectiveCost = kind === "video" ? videoCoinCost(resolution, duration) : cost;

  async function generate() {
    const body: Record<string, unknown> = { sourceItemId: promptId };
    if (imageData) body.image = imageData;
    if (kind === "video") {
      body.duration = duration;
      body.resolution = resolution;
    } else {
      body.aspect = aspect;
    }
    await run(kind === "video" ? "/api/generate/video" : "/api/generate/image", body, {
      cost: effectiveCost,
      mediaKind: kind,
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-caption font-medium uppercase tracking-wide text-low">
            Source photo <span className="normal-case text-low">(optional)</span>
          </p>
          <UploadDropzone
            value={file}
            onChange={setFile}
            label="Add a source photo"
            hint={kind === "video" ? "Optional — animates from your photo" : "Optional — guides the result"}
          />
        </div>

        {kind === "video" ? (
          <div className="flex flex-wrap gap-6">
            <Segmented
              name="duration"
              label="Duration"
              options={durations.map((d) => ({ value: d, label: `${d}s` }))}
              value={duration}
              onChange={setDuration}
            />
            <Segmented
              name="resolution"
              label="Resolution"
              options={resolutions.map((r) => ({ value: r, label: `${r}p` }))}
              value={resolution}
              onChange={setResolution}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Segmented
              name="aspect"
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

        <div className="flex items-center justify-between gap-3 border-t border-hairline pt-5">
          <span className="inline-flex items-center gap-1.5 font-mono text-caption text-mid">
            <Coins className="h-4 w-4 text-gold" />
            {effectiveCost} coins · balance{" "}
            <AnimatedNumber value={coins} className="font-medium text-hi" />
          </span>
          <Button type="button" onClick={generate} loading={state === "running"}>
            <Sparkles className="h-4 w-4" />
            Generate {kind === "video" ? "Video" : "Image"}
          </Button>
        </div>
      </div>

      <div>
        {state === "idle" ? (
          <div
            className="grid place-items-center rounded-card border border-dashed border-hairline bg-surface-2/40 text-center text-mid"
            style={{ aspectRatio: String(ratio) }}
          >
            <div className="space-y-2 p-6">
              <Sparkles className="mx-auto h-7 w-7 text-low" />
              <p className="text-caption">Your result will appear here.</p>
            </div>
          </div>
        ) : (
          <SummonResult state={state} result={result} onReset={reset} ratio={ratio} />
        )}
      </div>
    </div>
  );
}
