import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { config } from "./config";

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolve a catalog `*_path` / `*_image` column to an absolute URL — §1.7.
 * - absolute URLs (http/https/data) pass through untouched
 * - relative paths are joined onto MEDIA_BASE_URL
 * - empty/missing returns null (callers render a placeholder)
 */
export function resolveMedia(path?: string | null): string | null {
  if (!path) return null;
  const p = path.trim();
  if (!p) return null;
  if (/^(https?:|data:|blob:)/i.test(p)) return p;
  const base = config.mediaBaseUrl.replace(/\/+$/, "");
  const rel = p.replace(/^\/+/, "");
  return base ? `${base}/${rel}` : `/${rel}`;
}

/** Truncate a prompt for the LOCKED state — never leak the full text. §6 */
export function truncatePrompt(text: string, words = 14): string {
  const parts = text.trim().split(/\s+/);
  if (parts.length <= words) return text.trim();
  return parts.slice(0, words).join(" ") + " …";
}

/** Indian-style price formatting, e.g. 1199 -> "₹1,199". */
export function formatInr(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

export function formatCoins(n: number): string {
  return n.toLocaleString("en-IN");
}

/** Stable client-generated UUID for Runware taskUUID etc. */
export function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Deterministic small hash -> used to vary placeholder seeds, etc. */
export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function pluralize(n: number, singular: string, plural = singular + "s") {
  return `${n} ${n === 1 ? singular : plural}`;
}

/**
 * Normalize an Indian mobile number to 10 digits (strips +91, spaces, dashes).
 * Returns null if it isn't a valid 10-digit number starting 6–9.
 */
export function normalizeIndianPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const ten = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}
