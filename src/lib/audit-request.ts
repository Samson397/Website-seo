import { parseCrawlControls, type CrawlControls } from "@/lib/crawl-options";
import type { AuditOptions } from "@/lib/types";

/** Parse shared audit POST body fields into AuditOptions (minus onProgress). */
export function auditOptionsFromBody(body: Record<string, unknown> | null | undefined): {
  wantFull: boolean;
  unlockSessionId?: string;
  share: boolean;
  crawl: CrawlControls;
  auditOptions: Omit<AuditOptions, "onProgress" | "siteCrawl">;
} {
  const wantFull = body?.siteCrawl !== false;
  const unlockSessionId =
    typeof body?.unlockSessionId === "string" ? body.unlockSessionId : undefined;
  const share = body?.share !== false;
  const crawl = parseCrawlControls(body || undefined);

  return {
    wantFull,
    unlockSessionId,
    share,
    crawl,
    auditOptions: {
      maxPages: crawl.maxPages,
      includePaths: crawl.includePaths?.length ? crawl.includePaths : undefined,
      excludePaths: crawl.excludePaths?.length ? crawl.excludePaths : undefined,
      startPath: crawl.startPath,
    },
  };
}
