import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  subtitle,
  seeAllHref,
  seeAllLabel = "See all",
  className,
}: {
  title: string;
  subtitle?: string;
  seeAllHref?: string;
  seeAllLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex items-end justify-between gap-4", className)}>
      <div className="space-y-1">
        <h2 className="font-display text-h2 font-semibold text-hi">{title}</h2>
        {subtitle && <p className="text-caption text-mid">{subtitle}</p>}
      </div>
      {seeAllHref && (
        <Link
          href={seeAllHref}
          className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-cyan transition-colors hover:text-blue"
        >
          {seeAllLabel}
          <ArrowRight className="h-4 w-4 transition-transform duration-base group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
