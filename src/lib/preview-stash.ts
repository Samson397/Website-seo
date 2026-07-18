const PREVIEW_ID_KEY = "seohub_preview_id";
const PREVIEW_URL_KEY = "seohub_preview_url";

/** Remember free-preview stash so Stripe return can unlock without re-scan. */
export function savePreviewStash(previewId: string, url: string) {
  try {
    sessionStorage.setItem(PREVIEW_ID_KEY, previewId);
    sessionStorage.setItem(PREVIEW_URL_KEY, url);
  } catch {
    /* private mode */
  }
}

export function readPreviewStash(): { previewId: string; url: string } | null {
  try {
    const previewId = sessionStorage.getItem(PREVIEW_ID_KEY);
    const url = sessionStorage.getItem(PREVIEW_URL_KEY);
    if (!previewId || !url) return null;
    return { previewId, url };
  } catch {
    return null;
  }
}

export function clearPreviewStash() {
  try {
    sessionStorage.removeItem(PREVIEW_ID_KEY);
    sessionStorage.removeItem(PREVIEW_URL_KEY);
  } catch {
    /* ignore */
  }
}
