"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Modal — bottom-sheet on mobile, centered on desktop, blur backdrop (§11.6).
 * Pure CSS enter/exit transitions (no framer-motion), so it adds no heavy JS to
 * the pages that use it (detail, pricing, auth, unlock dialog).
 */
export function Modal({
  open,
  onClose,
  children,
  title,
  className,
  dismissable = true,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
  dismissable?: boolean;
}) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  // keep mounted through the exit transition; toggle `visible` to animate
  useEffect(() => {
    if (open) {
      setMounted(true);
      const r = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(r);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 220);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissable) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mounted, onClose, dismissable]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center">
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0",
        )}
        onClick={dismissable ? onClose : undefined}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "glass relative z-10 w-full max-w-md rounded-t-modal border border-hairline p-6 shadow-card transition-all duration-200 ease-out-expo sm:rounded-modal",
          visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-[0.98] opacity-0",
          className,
        )}
      >
        {(title || dismissable) && (
          <div className="mb-4 flex items-start justify-between gap-4">
            {title && <h2 className="font-display text-lg font-semibold text-hi">{title}</h2>}
            {dismissable && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-pill text-mid transition-colors hover:bg-surface-2 hover:text-hi"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
