import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Coins, Gem } from "lucide-react";
import type { Tool } from "@/lib/types";

export function ToolCard({ tool, priority }: { tool: Tool; priority?: boolean }) {
  return (
    <Link
      href={`/tools/${tool.toolKey}`}
      className="group flex flex-col overflow-hidden rounded-card border border-hairline bg-surface shadow-card transition-all duration-base ease-out-expo hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
        {tool.afterImage && (
          <Image
            src={tool.afterImage}
            alt={tool.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            priority={priority}
            className="object-cover transition-transform duration-slow ease-out-expo group-hover:scale-105"
          />
        )}
        <div className="media-scrim absolute inset-0" />
        {tool.requiresPro && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-pill bg-grad-gold px-2 py-0.5 text-[10px] font-semibold uppercase text-gold-ink shadow-glow-gold">
            <Gem className="h-3 w-3" />
            Pro
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base font-semibold text-hi">{tool.name}</h3>
        <p className="mt-1 text-caption text-mid">{tool.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-hairline px-2.5 py-1 font-mono text-caption text-hi">
            <Coins className="h-3.5 w-3.5 text-gold" />
            {tool.coinCost}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-cyan transition-transform duration-base group-hover:translate-x-0.5">
            Open
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
