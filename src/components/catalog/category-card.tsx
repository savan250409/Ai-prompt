import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Category tile — category_image + name, ordered by sort_order (§6). */
export function CategoryCard({
  category,
  href,
  className,
  priority,
}: {
  category: Category;
  href: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative block aspect-[7/5] overflow-hidden rounded-card border border-hairline bg-surface-2 shadow-card transition-all duration-base ease-out-expo hover:-translate-y-1 hover:shadow-card-hover",
        className,
      )}
    >
      {category.image && (
        <Image
          src={category.image}
          alt={category.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          priority={priority}
          className="object-cover transition-transform duration-slow ease-out-expo group-hover:scale-105"
        />
      )}
      <div className="media-scrim absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
        <div>
          <h3 className="font-display text-base font-semibold leading-tight text-white">
            {category.name}
          </h3>
          {category.type && (
            <span className="text-caption text-white/65">{category.type}</span>
          )}
        </div>
        <span className="grid h-8 w-8 shrink-0 translate-y-1 place-items-center rounded-pill bg-white/12 text-white opacity-0 backdrop-blur-sm transition-all duration-base group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
