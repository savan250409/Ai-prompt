/**
 * Display-time cleanup for upstream catalog text. The content tables are
 * external/read-only (we never migrate them), so known typos and leaked
 * template placeholders are corrected here at the data facade instead — §audit
 * 9 (placeholder prompt names) and §audit 16 (spelling/label typos).
 */

/** Known content typos in category/filter/prompt names → corrected spelling. */
const TYPO_FIXES: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bGhibly\b/gi, "Ghibli"],
  [/\bMirror Selfi\b/gi, "Mirror Selfie"],
  [/\bLinked-in\b/gi, "LinkedIn"],
  [/\bGpt40\b/gi, "Gpt4o"],
];

/** Lowercased names that are unfilled template/personalization placeholders. */
const PLACEHOLDERS = new Set([
  "country name",
  "enter your name",
  "your name",
  "name",
  "untitled",
  "placeholder",
]);

/** Apply known spelling corrections to a user-facing label. */
function fixTypos(name: string): string {
  return TYPO_FIXES.reduce((out, [pattern, good]) => out.replace(pattern, good), name);
}

/** Trim + typo-correct a category/filter name (keeps it non-empty). */
export function cleanLabel(name: string | null | undefined): string | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  return fixTypos(trimmed);
}

/**
 * Clean a prompt's hint: typo-corrected, but `null` when it's a leaked
 * placeholder so callers fall back to a real, descriptive name (§audit 9).
 */
export function cleanHint(hint: string | null | undefined): string | null {
  const label = cleanLabel(hint);
  if (!label) return null;
  if (PLACEHOLDERS.has(label.toLowerCase()) || /^enter your\b/i.test(label)) return null;
  return label;
}
