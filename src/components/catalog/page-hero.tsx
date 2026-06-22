import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

/** Section page header for catalog routes (§6). */
export function PageHero({
  title,
  subtitle,
  eyebrow,
  top,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  top?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden border-b border-hairline", className)}>
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_srgb,var(--blue)_18%,transparent),transparent)]" />
      <Container className="relative py-10 md:py-14">
        {top && <div className="mb-4">{top}</div>}
        {eyebrow && (
          <span className="text-caption font-semibold uppercase tracking-[0.14em] text-cyan">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-2 font-display text-h1 font-semibold text-hi">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-pretty text-mid">{subtitle}</p>}
        {children && <div className="mt-6">{children}</div>}
      </Container>
    </div>
  );
}
