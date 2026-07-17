import Link from "next/link";
import { HomeScanApp } from "@/components/HomeScanApp";
import { HomeFeatures } from "@/components/HomeFeatures";
import { RouteCards } from "@/components/RouteCards";
import { AdSlot } from "@/components/AdSlot";
import { routes } from "@/lib/routes";

/**
 * Server-rendered home: brand, H1, and marketing copy stay in the HTML for crawlers.
 * Interactive scan UI is a client island (avoids thin-content CSR bailout).
 */
export default function HomePage() {
  return (
    <main className="min-h-screen pb-16">
      <HomeScanApp
        hero={
          <>
            <div className="animate-rise flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark.svg" alt="" width={56} height={56} className="h-14 w-14" />
              <p className="font-display text-4xl font-semibold tracking-tight text-white sm:text-6xl">
                SEOHub
              </p>
            </div>
            <h1 className="font-display animate-rise-delay-1 mt-5 max-w-3xl text-2xl font-semibold tracking-tight text-brand-bright sm:text-4xl">
              Free full-site SEO audit you run every week
            </h1>
            <p className="animate-rise-delay-2 mt-4 max-w-xl text-base text-white/75 sm:text-lg">
              Crawl every page, run 50+ Pass/Fail checks, and track a watchlist on your device —
              free homepage preview, no account required.
            </p>
          </>
        }
        marketing={
          <>
            <RouteCards />
            <div className="mt-10">
              <AdSlot />
            </div>
            <HomeFeatures />
            <section className="mt-12 border-t border-ink/10 px-2 py-10 sm:px-0">
              <h2 className="font-display text-2xl font-semibold text-ink">
                What SEOHub checks on every scan
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
                SEOHub fetches public HTML from your site, discovers URLs from sitemap.xml and
                internal links, then scores SEO, security headers, accessibility, performance
                signals, DNS, and SSL. Free tools cover keyword research, rank checks, content
                optimization, redirects, schema, and broken links — so you can fix issues without a
                SaaS subscription.
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
                Unlock a full crawl of up to 200 pages when you need site-wide duplicate titles,
                thin content flags, shareable reports, and exports. Until then, run unlimited
                homepage previews and use the toolkit for free.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ToolLink href={routes.history} label="History & watchlist" />
                <ToolLink href={routes.keywords} label="Keyword research" />
                <ToolLink href={routes.metaPreview} label="Meta & SERP preview" />
                <ToolLink href={routes.redirects} label="Redirect chain" />
                <ToolLink href={routes.guides} label="Fix guides" />
                <ToolLink href={routes.competitors} label="Competitor compare" />
                <ToolLink href={routes.pricing} label="Pricing" />
              </div>
            </section>
          </>
        }
      />
    </main>
  );
}

function ToolLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-brand/40 hover:bg-brand-soft"
    >
      {label}
    </Link>
  );
}
