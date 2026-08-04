// src/components/photo-prompts/PromptSection.jsx
import React from "react";

export default function PromptSection() {
  return (
    <section id="new-ai-photo-prompt-examples" className="relative overflow-hidden border-[#0d47a1]/10 border-y bg-white/80 px-4 py-10 text-black md:px-8 md:py-12">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(13,71,161,0.035)_0%,rgba(13,71,161,0.035)_50%,rgba(245,158,11,0.07)_50.3%,rgba(245,158,11,0.07)_100%)]"></div>
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_390px] lg:items-end">
          <div>
            <div className="mb-3 inline-flex border border-[#0d47a1]/15 bg-[#fff7ed]/80 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#0d47a1]">
              Portrait and selfie prompts
            </div>
            <h2 className="text-xl font-black uppercase leading-tight tracking-normal text-[#0d47a1] text-balance md:text-4xl md:leading-none">
              AI Photo Prompts
            </h2>
          </div>
          <p className="border-[#0d47a1]/45 border-l-2 pl-3 text-sm font-bold leading-6 text-[#475569] md:pl-4 md:text-base">
            New photo prompt examples for portraits and selfies, curated for users who want to upload a real photo and create a more polished AI-edited look.
          </p>
        </div>
        <div className="relative">
          <div className="mb-3 flex justify-end gap-2 md:mb-4 md:gap-3">
            <button type="button" aria-label="Previous new AI photo prompt example" title="Previous new AI photo prompt example" className="grid h-9 w-9 touch-manipulation place-items-center border border-[#0d47a1]/20 bg-white/90 text-[#0d47a1] transition-[background-color,border-color,transform] md:hover:-translate-y-0.5 md:hover:border-[#0d47a1]/50 md:hover:bg-[#fff7ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d47a1] active:translate-y-0">
              {/* left chevron */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left h-4 w-4 stroke-[3]" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button type="button" aria-label="Next new AI photo prompt example" title="Next new AI photo prompt example" className="grid h-9 w-9 touch-manipulation place-items-center border border-[#0d47a1]/20 bg-white/90 text-[#0d47a1] transition-[background-color,border-color,transform] md:hover:-translate-y-0.5 md:hover:border-[#0d47a1]/50 md:hover:bg-[#fff7ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d47a1] active:translate-y-0">
              {/* right chevron */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right h-4 w-4 stroke-[3]" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
          <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-0 pt-1 pb-3 [scrollbar-width:none] md:-mx-8 md:gap-4 md:px-8 md:pt-2 [&::-webkit-scrollbar]:hidden">
            {/* Example article cards – you can map these from fetched data */}
            {/* Placeholder for first card */}
            <article className="group relative flex h-[342px] min-w-0 flex-[0_0_44%] snap-start flex-col border border-[#0d47a1]/15 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.07)] transition-[border-color,box-shadow,transform] md:h-[500px] md:flex-[0_0_260px] md:border-2 md:hover:-translate-y-1 md:hover:border-[#0d47a1]/30 md:hover:shadow-[0_12px_30px_rgba(15,23,42,0.11)]">
              <div className="relative h-[150px] shrink-0 overflow-hidden border-[#0d47a1]/10 border-b bg-[#e2e8f0] md:h-[280px] md:border-b-2">
                <img alt="Monochromatic Red Carpet Tuxedo Portrait" loading="lazy" decoding="async" className="object-cover object-top transition-transform duration-500 md:group-hover:scale-[1.03]" style={{position:"absolute",height:"100%",width:"100%",left:0,top:0,right:0,bottom:0,color:"transparent"}} src="/placeholder.jpg" />
                <span className="absolute top-2 left-2 z-10 border border-white/70 bg-white/90 px-1.5 py-0.5 font-mono text-[9px] font-black text-[#0d47a1] shadow-[0_2px_8px_rgba(15,23,42,0.12)] backdrop-blur md:text-[10px]">01</span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col p-2 md:p-3">
                <h3 className="line-clamp-2 min-h-[2.25rem] text-sm font-black leading-tight md:min-h-[2.5rem] md:text-base">Monochromatic Red Carpet Tuxedo Portrait</h3>
                <p className="mt-1 line-clamp-2 min-h-8 text-[10px] font-bold leading-4 text-[#64748b] md:min-h-10 md:text-xs md:leading-5">Influencer / Model • Photography • Product Marketing • Nano Banana Pro</p>
                <div className="mt-auto grid gap-1.5">
                  <button type="button" className="group/use inline-flex h-11 w-full touch-manipulation items-center justify-center gap-1.5 border border-[#0d47a1] bg-[#0d47a1] px-1.5 py-2 text-center text-[10px] font-black leading-tight text-white shadow-[0_6px_16px_rgba(13,71,161,0.18)] transition-[background-color,box-shadow,transform] hover:bg-[#083b88] hover:shadow-[0_8px_20px_rgba(13,71,161,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f59e0b] focus-visible:ring-offset-2 md:px-2 md:text-xs">
                    Generate with this prompt
                  </button>
                  <button type="button" className="inline-flex h-9 w-full touch-manipulation items-center justify-center gap-1.5 border border-transparent bg-transparent px-1.5 py-1.5 text-center text-[10px] font-bold leading-tight text-[#0d47a1] transition-colors hover:bg-[#0d47a1]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d47a1] focus-visible:ring-offset-2 md:px-2 md:text-xs">
                    View full prompt
                  </button>
                </div>
              </div>
            </article>
            {/* Add additional articles similarly or map from data */}
          </div>
        </div>
      </div>
    </section>
  );
}
