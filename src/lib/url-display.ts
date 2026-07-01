/** Show domain + path without https:// in the UI */
export function formatUrlDisplay(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname === "/" ? "" : u.pathname;
    return `${u.hostname}${path}${u.search}`;
  } catch {
    return url.replace(/^https?:\/\//i, "");
  }
}
