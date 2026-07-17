import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    app: "seoscan",
    version: "0.2.0",
    features: {
      fullSiteCrawl: true,
      competitorCompare: true,
      tools: ["meta-preview", "robots", "headers"],
      pageSpeed: Boolean(process.env.PAGESPEED_API_KEY),
      backlinks: Boolean(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD),
    },
  });
}
