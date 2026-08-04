"use client";

import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/store/session";
import { track } from "@/lib/analytics";

export type GenState = "idle" | "running" | "done" | "failed";
export interface GenResult {
  url: string;
  kind: "image" | "video";
}

/**
 * Drives a generation: POST -> (sync done | async poll) -> result, with an
 * optimistic coin deduct and a /api/me refresh (server is authoritative; coins
 * are refunded server-side on failure). Used by the prompt/filter/tool studios.
 */
export function useGeneration() {
  const queryClient = useQueryClient();
  const spend = useSession((s) => s.spendCoinsOptimistic);
  const [state, setState] = useState<GenState>("idle");
  const [result, setResult] = useState<GenResult | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshMe = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["me"] }),
    [queryClient],
  );

  const finishDone = useCallback(
    (url: string, mediaKind: "image" | "video") => {
      setResult({ url, kind: mediaKind });
      setState("done");
      toast.success(mediaKind === "video" ? "Video ready" : "Image ready");
      track("generation_done", { kind: mediaKind });
      void refreshMe();
    },
    [refreshMe],
  );

  const poll = useCallback(
    (id: string, mediaKind: "image" | "video") => {
      let tries = 0;
      const tick = async () => {
        tries++;
        try {
          const gen = await fetch(`/api/generations/${id}`).then((r) => r.json());
          if (gen.status === "done" && gen.outputMediaPath) {
            finishDone(gen.outputMediaPath, mediaKind);
            return;
          }
          if (gen.status === "failed") {
            setState("failed");
            toast.error("Generation failed — coins refunded.");
            void refreshMe();
            return;
          }
        } catch {
          /* transient — keep polling */
        }
        if (tries > 60) {
          setState("failed");
          toast.error("Generation timed out.");
          return;
        }
        timer.current = setTimeout(tick, 1500);
      };
      void tick();
    },
    [finishDone, refreshMe],
  );

  const run = useCallback(
    async (
      endpoint: string,
      body: Record<string, unknown>,
      opts: { cost: number; mediaKind: "image" | "video" },
    ) => {
      if (timer.current) clearTimeout(timer.current);
      setState("running");
      setResult(null);
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setState("failed");
          toast.error(data.error ?? "Generation failed.");
          void refreshMe();
          return;
        }
        spend(opts.cost); // optimistic; server already deducted
        if (data.status === "done") {
          finishDone(data.outputUrl, opts.mediaKind);
        } else {
          poll(data.generationId, opts.mediaKind);
        }
      } catch {
        setState("failed");
        toast.error("Generation failed.");
      }
    },
    [finishDone, poll, refreshMe, spend],
  );

  const reset = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setState("idle");
    setResult(null);
  }, []);

  return { state, result, run, reset };
}
