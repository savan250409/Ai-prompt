import Link from "next/link";
import { SmoothImage } from "@/components/ui/smooth-image";
import type { FilterItem } from "@/lib/types";

export function FilterCard({ filter, priority }: { filter: FilterItem; priority?: boolean }) {
  return (
    <Link
      href={`/filters/${filter.id}`}
      className="group relative block aspect-square overflow-hidden rounded-card border border-hairline bg-surface-2 shadow-card transition-all duration-base ease-out-expo hover:-translate-y-1 hover:shadow-card-hover"
    >
      {filter.image && (
        <SmoothImage
          src={filter.image}
          // decorative: the visible <h3> below already names the card (§audit 13)
          alt=""
          fill
          sizes="(max-width: 768px) 33vw, 16vw"
          priority={priority}
          className="object-cover transition-transform duration-slow ease-out-expo group-hover:scale-105"
        />
      )}
      <div className="media-scrim absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 p-3">
        <h3 className="font-display text-sm font-semibold leading-tight text-white">
          {filter.name}
        </h3>
      </div>
    </Link>
  );
}
