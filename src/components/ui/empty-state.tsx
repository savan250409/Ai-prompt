import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  hint,
  icon,
  action,
  className,
}: {
  title: string;
  hint?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-hairline bg-surface/40 px-6 py-16 text-center",
        className,
      )}
    >
      {icon && <div className="text-low">{icon}</div>}
      <h3 className="font-display text-lg font-semibold text-hi">{title}</h3>
      {hint && <p className="max-w-sm text-caption text-mid">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
