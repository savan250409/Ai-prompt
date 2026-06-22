import { cn } from "@/lib/utils";

/**
 * Pure button-style helper — lives OUTSIDE the "use client" module so server
 * components can call it (a "use client" export becomes a non-callable client
 * reference when imported on the server). Use for `<Link className={buttonClass(...)}>`.
 */
export type ButtonVariant =
  | "primary"
  | "pro"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export const buttonBase =
  "group relative inline-flex items-center justify-center gap-2 font-medium rounded-pill select-none whitespace-nowrap transition-[transform,box-shadow,background-color,border-color,color,filter] duration-fast ease-out-expo active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none";

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  // electric gradient = primary CTAs — §11.2
  primary: "text-on-electric bg-grad-electric shadow-glow hover:brightness-110",
  // gold gradient = Pro/premium only — §11.2
  pro: "text-gold-ink bg-grad-gold shadow-glow-gold hover:brightness-105",
  secondary: "text-hi bg-surface-2 border border-hairline hover:bg-surface",
  outline: "text-hi border border-hairline hover:bg-surface-2",
  ghost: "text-mid hover:text-hi hover:bg-surface-2",
  danger: "text-white bg-danger hover:brightness-110",
};

export const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-caption",
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-7 text-base",
  icon: "h-10 w-10 p-0",
};

export function buttonClass(opts?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return cn(
    buttonBase,
    buttonVariantClasses[opts?.variant ?? "primary"],
    buttonSizeClasses[opts?.size ?? "md"],
    opts?.className,
  );
}
