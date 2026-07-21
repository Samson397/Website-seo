import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Prefer www in production so www and apex are not both indexable. */
const PREFERRED_HOST = "www.seohub.online";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();
  if (!host) return NextResponse.next();

  // OAuth web client redirect_uri is https://www.seohub.online — forward code to callback.
  const { pathname, searchParams } = request.nextUrl;
  if (
    pathname === "/" &&
    searchParams.has("code") &&
    searchParams.has("state")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/api/auth/google/callback";
    return NextResponse.rewrite(url);
  }

  // Local / preview deployments keep their host
  if (host === "localhost" || host.endsWith(".vercel.app")) {
    return NextResponse.next();
  }

  if (host === "seohub.online") {
    const url = request.nextUrl.clone();
    url.host = PREFERRED_HOST;
    url.protocol = "https";
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|txt|xml|webmanifest)$).*)"],
};
