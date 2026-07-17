import { NextRequest, NextResponse } from "next/server";
import { unsubscribeDigest } from "@/lib/digest";
import { getSiteUrl } from "@/lib/site-url";
import { APP_NAME } from "@/lib/brand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  const ok = await unsubscribeDigest(token).catch(() => false);
  const siteUrl = getSiteUrl();

  const html = `<!DOCTYPE html><html><head><title>Unsubscribe — ${APP_NAME}</title>
  <meta name="robots" content="noindex"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>body{font-family:Georgia,serif;max-width:480px;margin:4rem auto;padding:0 1.25rem;color:#0c1222}
  a{color:#0d9488}</style></head><body>
  <p style="letter-spacing:.16em;text-transform:uppercase;font-size:12px;color:#0d9488;font-weight:700">${APP_NAME}</p>
  <h1>${ok ? "Unsubscribed" : "Link invalid"}</h1>
  <p>${ok ? "You will no longer receive weekly watchlist digests." : "That unsubscribe link is invalid or expired."}</p>
  <p><a href="${siteUrl}">Back to ${APP_NAME}</a></p>
  </body></html>`;

  return new NextResponse(html, {
    status: ok ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
