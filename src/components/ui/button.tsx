"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import {
  buttonClass,
  type ButtonSize,
  type ButtonVariant,
} from "./button-variants";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

/** Sweep highlight on hover for gradient buttons — §11.6. */
function Sweep() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-pill">
      <span className="absolute top-0 left-0 h-full w-1/3 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out-expo group-hover:translate-x-[350%] motion-reduce:hidden" />
    </span>
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, children, loading, disabled, ...props },
  ref,
) {
  const gradient = variant === "primary" || variant === "pro";
  return (
    <button
      ref={ref}
      className={buttonClass({ variant, size, className })}
      disabled={disabled || loading}
      {...props}
    >
      {gradient && <Sweep />}
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </button>
  );
});
