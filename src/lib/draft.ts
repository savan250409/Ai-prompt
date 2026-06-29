/**
 * Persist an in-progress studio upload (image + prompt + aspect) across the
 * login round-trip. The tool/filter pages are viewable while logged-out, so a
 * sign-in redirect would otherwise wipe the React state and lose the upload.
 * We stash a draft in sessionStorage before redirecting and restore it on
 * return. Client-only.
 */
export interface StudioDraft {
  image?: string; // data URI
  prompt?: string;
  aspect?: string;
}

export function saveDraft(key: string, draft: StudioDraft): void {
  try {
    sessionStorage.setItem(`draft:${key}`, JSON.stringify(draft));
  } catch {
    // quota exceeded (very large image) — skip; the upload just won't persist.
  }
}

/** Read AND remove the draft (one-shot restore). */
export function takeDraft(key: string): StudioDraft | null {
  try {
    const raw = sessionStorage.getItem(`draft:${key}`);
    if (!raw) return null;
    sessionStorage.removeItem(`draft:${key}`);
    return JSON.parse(raw) as StudioDraft;
  } catch {
    return null;
  }
}

/** Turn a stored data URI back into a File so the upload UI + flow work. */
export async function dataUriToFile(dataUri: string, name = "upload"): Promise<File> {
  const res = await fetch(dataUri);
  const blob = await res.blob();
  const ext = (blob.type.split("/")[1] || "png").split("+")[0];
  return new File([blob], `${name}.${ext}`, { type: blob.type || "image/png" });
}
