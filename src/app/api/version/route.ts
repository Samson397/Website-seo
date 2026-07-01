import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    app: "seoscan",
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? "local",
    features: {
      checklist: true,
      siteOverview: true,
      fullSiteCrawl: true,
      pageSpeed: Boolean(process.env.PAGESPEED_API_KEY),
      dataForSeo: Boolean(
        process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD
      ),
    },
  });
}
