"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Coins, Gem, Sparkles } from "lucide-react";
import type { Tool } from "@/lib/types";
import { UploadDropzone } from "./upload-dropzone";
import { SummonResult } from "./summon-result";
import { useGeneration } from "./use-generation";
import { Button } from "@/components/ui/button";
import { useSession, selectIsPro } from "@/store/session";
import { fileToDataUri } from "@/lib/file";

/** Tool studio (§6, §7a). image_generation is text-to-image; rest take a photo. */
export function ToolStudio({ tool }: { tool: Tool }) {
  const router = useRouter();
  const me = useSession((s) => s.me);
  const isPro = useSession(selectIsPro);
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const { state, result, run, reset } = useGeneration();
  const needsUpload = tool.toolKey !== "image_generation";

  async function generate() {
    if (needsUpload && !file) return toast.info("Upload a photo to continue.");
    if (!needsUpload && !prompt.trim()) return toast.info("Describe what you'd like to generate.");
    if (tool.requiresPro && !isPro) {
      toast.info("This tool is included with Pro.");
      return router.push("/pricing");
    }
    if (!me?.authenticated) {
      toast.info("Sign in to use this tool.");
      return router.push(`/login?next=/tools/${tool.toolKey}`);
    }
    const body: Record<string, unknown> = { toolKey: tool.toolKey };
    if (needsUpload && file) body.image = await fileToDataUri(file);
    if (!needsUpload) body.prompt = prompt;
    await run("/api/generate/tool", body, { cost: tool.coinCost, mediaKind: "image" });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-3">
        <p className="text-caption font-medium uppercase tracking-wide text-low">Before / After</p>
        <div className="grid grid-cols-2 gap-3">
          <Sample src={tool.beforeImage} label="Before" />
          <Sample src={tool.afterImage} label="After" />
        </div>
      </div>

      <div className="space-y-5">
        {state === "idle" ? (
          <>
            {needsUpload ? (
              <UploadDropzone value={file} onChange={setFile} />
            ) : (
              <div>
                <p className="mb-2 text-caption font-medium uppercase tracking-wide text-low">Prompt</p>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={5}
                  placeholder="A neon-lit street at night, cinematic, 35mm…"
                  className="w-full resize-y rounded-input border border-hairline bg-surface-2 p-3.5 font-mono text-sm text-hi placeholder:text-low focus-visible:border-cyan focus-visible:outline-none"
                />
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-hairline px-3 py-1.5 font-mono text-caption text-hi">
                <Coins className="h-3.5 w-3.5 text-gold" />
                {tool.coinCost} coins{tool.requiresPro ? " · Pro" : " · or Pro"}
              </span>
              <Button variant={tool.requiresPro ? "pro" : "primary"} onClick={generate}>
                {tool.requiresPro ? <Gem className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                Generate
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

function Sample({ src, label }: { src: string | null; label: string }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-card border border-hairline bg-surface-2">
      {src && <Image src={src} alt={label} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover" />}
      <span className="absolute left-2 top-2 rounded-pill bg-black/45 px-2 py-0.5 text-[10px] font-medium uppercase text-white/90 backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}
