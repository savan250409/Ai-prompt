"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, Eye, Copy, Check, X, Sparkles } from "lucide-react";

interface PromptItem {
  id: number;
  title: string;
  category: string;
  imgSrc: string;
  badge: string;
  promptText: string;
}

export function TrendingPhotoPrompts() {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selected prompt for modal
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null);
  
  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadPrompts() {
      try {
        setLoading(true);
        const res = await fetch("/api/trending-prompts");
        const data = await res.json();
        if (data.success && Array.isArray(data.prompts)) {
          setPrompts(data.prompts);
        } else {
          throw new Error(data.error || "Failed to load prompts");
        }
      } catch (err: any) {
        console.error("Error loading prompts:", err);
        setError(err.message || "Failed to connect");
      } finally {
        setLoading(false);
      }
    }
    loadPrompts();
  }, []);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -560 : 560;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleCopy = (item: PromptItem) => {
    navigator.clipboard.writeText(item.promptText);
    setCopiedId(item.id);
    showToast(`Copied prompt for "${item.title}"`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <section
      id="new-ai-photo-prompt-examples"
      className="relative overflow-hidden border-[#0d47a1]/10 border-y bg-white/80 dark:bg-slate-900/90 px-4 py-10 text-slate-900 dark:text-slate-100 md:px-8 md:py-12 rounded-2xl my-8 shadow-xl"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(135deg,rgba(13,71,161,0.035)_0%,rgba(13,71,161,0.035)_50%,rgba(245,158,11,0.07)_50.3%,rgba(245,158,11,0.07)_100%)]" />

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_390px] lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 border border-[#0d47a1]/15 bg-[#fff7ed]/80 dark:bg-slate-800/80 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#0d47a1] dark:text-cyan-400 rounded-sm">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Portrait and selfie prompts
            </div>
            <h2 className="text-xl font-black uppercase leading-tight tracking-normal text-[#0d47a1] dark:text-white text-balance md:text-3xl md:leading-none">
              New AI Photo Prompt Examples
            </h2>
          </div>
          <p className="border-[#0d47a1]/45 border-l-2 pl-3 text-sm font-bold leading-6 text-[#475569] dark:text-slate-300 md:pl-4 md:text-base">
            New photo prompt examples for portraits and selfies, curated for users who want to upload a real photo and create a more polished AI-edited look.
          </p>
        </div>

        {/* Carousel / Controls */}
        <div className="relative">
          <div className="mb-3 flex justify-end gap-2 md:mb-4 md:gap-3">
            <button
              type="button"
              onClick={() => handleScroll("left")}
              aria-label="Previous new AI photo prompt example"
              title="Previous prompt"
              className="grid h-9 w-9 touch-manipulation place-items-center border border-[#0d47a1]/20 bg-white/90 dark:bg-slate-800 dark:border-slate-700 text-[#0d47a1] dark:text-cyan-400 rounded-md transition-all md:hover:-translate-y-0.5 md:hover:border-[#0d47a1]/50 md:hover:bg-[#fff7ed] active:translate-y-0 shadow-sm"
            >
              <ChevronLeft className="h-4 w-4 stroke-[3]" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll("right")}
              aria-label="Next new AI photo prompt example"
              title="Next prompt"
              className="grid h-9 w-9 touch-manipulation place-items-center border border-[#0d47a1]/20 bg-white/90 dark:bg-slate-800 dark:border-slate-700 text-[#0d47a1] dark:text-cyan-400 rounded-md transition-all md:hover:-translate-y-0.5 md:hover:border-[#0d47a1]/50 md:hover:bg-[#fff7ed] active:translate-y-0 shadow-sm"
            >
              <ChevronRight className="h-4 w-4 stroke-[3]" />
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex h-64 items-center justify-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
              <span className="text-sm font-semibold text-slate-500">Loading AI Prompts...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 text-center text-sm font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 rounded-lg">
              Failed to load prompts: {error}
            </div>
          )}

          {/* Cards Container */}
          {!loading && !error && (
            <div
              ref={scrollContainerRef}
              className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-0 pt-1 pb-4 [scrollbar-width:none] md:-mx-4 md:gap-4 md:px-4 md:pt-2 [&::-webkit-scrollbar]:hidden"
            >
              {prompts.map((item) => (
                <article
                  key={item.id}
                  className="group relative flex h-[360px] min-w-0 flex-[0_0_80%] sm:flex-[0_0_45%] snap-start flex-col border border-[#0d47a1]/15 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 rounded-xl shadow-[0_6px_20px_rgba(15,23,42,0.07)] transition-all duration-300 md:h-[480px] md:flex-[0_0_260px] md:border-2 md:hover:-translate-y-1 md:hover:border-[#0d47a1]/40 md:hover:shadow-[0_12px_30px_rgba(15,23,42,0.15)] overflow-hidden"
                >
                  {/* Card Image Header */}
                  <div className="relative h-[160px] shrink-0 overflow-hidden border-[#0d47a1]/10 border-b bg-[#e2e8f0] dark:bg-slate-900 md:h-[260px] md:border-b-2">
                    <img
                      alt={item.title}
                      loading="lazy"
                      src={item.imgSrc}
                      className="h-full w-full object-cover object-top transition-transform duration-500 md:group-hover:scale-105"
                      onError={(e) => {
                        // Fallback image
                        (e.target as HTMLImageElement).src =
                          "/cdn-cgi/image/width=640,quality=90,format=auto/https://cms-assets.youmind.com/media/1785654872281_yitryr_HOqLfg0XQAA9fNU.jpg";
                      }}
                    />
                    <span className="absolute top-2 left-2 z-10 border border-white/70 bg-white/90 dark:bg-slate-900/90 dark:border-slate-700 px-1.5 py-0.5 font-mono text-[9px] font-black text-[#0d47a1] dark:text-cyan-400 shadow-[0_2px_8px_rgba(15,23,42,0.12)] backdrop-blur md:text-[10px] rounded-sm">
                      {item.badge}
                    </span>
                  </div>

                  {/* Card Content Body */}
                  <div className="flex min-h-0 flex-1 flex-col p-3 md:p-4">
                    <h3 className="line-clamp-2 min-h-[2.25rem] text-sm font-black leading-tight text-slate-900 dark:text-slate-100 md:min-h-[2.5rem] md:text-base">
                      {item.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 min-h-8 text-[10px] font-bold leading-4 text-[#64748b] dark:text-slate-400 md:min-h-10 md:text-xs md:leading-5">
                      {item.category}
                    </p>

                    {/* Card Actions */}
                    <div className="mt-auto grid gap-1.5 pt-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(item)}
                        className="group/use inline-flex h-10 w-full touch-manipulation items-center justify-center gap-1.5 border border-[#0d47a1] bg-[#0d47a1] hover:bg-[#083b88] dark:bg-blue-600 dark:hover:bg-blue-700 dark:border-blue-600 px-2 py-2 text-center text-[10px] font-black leading-tight text-white rounded-lg shadow-[0_4px_12px_rgba(13,71,161,0.18)] transition-all active:translate-y-px md:text-xs"
                      >
                        <span className="line-clamp-1">
                          {copiedId === item.id ? "Copied!" : "Generate with this prompt"}
                        </span>
                        {copiedId === item.id ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                        ) : (
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 stroke-[3] transition-transform group-hover/use:translate-x-0.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPrompt(item)}
                        className="inline-flex h-8 w-full touch-manipulation items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-2 py-1 text-center text-[10px] font-bold leading-tight text-[#0d47a1] dark:text-cyan-300 hover:bg-[#0d47a1]/10 rounded-lg transition-colors md:text-xs"
                      >
                        <Eye className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
                        <span className="line-clamp-1">View full prompt</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Dialog for View Full Prompt */}
      {selectedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setSelectedPrompt(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 pr-8">
              <span className="font-mono text-xs font-black text-[#0d47a1] dark:text-cyan-400 bg-blue-50 dark:bg-slate-800 px-2 py-1 rounded">
                #{selectedPrompt.badge}
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {selectedPrompt.title}
              </h3>
            </div>

            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
              {selectedPrompt.category}
            </p>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Full AI Prompt Text
              </span>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 leading-relaxed max-h-48 overflow-y-auto select-all">
                {selectedPrompt.promptText}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPrompt(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleCopy(selectedPrompt);
                  setSelectedPrompt(null);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0d47a1] hover:bg-[#083b88] dark:bg-blue-600 dark:hover:bg-blue-700 rounded-xl shadow-md transition-all active:scale-95"
              >
                <Copy className="h-4 w-4" />
                Copy Prompt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl text-xs font-bold animate-in slide-in-from-bottom-5 duration-200">
          <Sparkles className="h-4 w-4 text-amber-400 dark:text-amber-600" />
          <span>{toastMessage}</span>
        </div>
      )}
    </section>
  );
}
