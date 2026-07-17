import { NextResponse } from "next/server";
import { isStoreConfigured } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    app: "seoscan",
    version: "0.3.0",
    features: {
      fullSiteCrawl: true,
      competitorCompare: true,
      benchmarks: true,
      localWatchlist: true,
      ads: Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT),
      firebase: isStoreConfigured(),
      webhook: Boolean(process.env.DATA_WEBHOOK_URL),
      tools: ["meta-preview", "robots", "headers"],
      pageSpeed: Boolean(process.env.PAGESPEED_API_KEY),
      backlinks: Boolean(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD),
    },
  });
}
