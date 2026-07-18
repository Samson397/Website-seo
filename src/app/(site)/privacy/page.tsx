import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { routes } from "@/lib/routes";

import { pageMeta } from "@/lib/page-meta";

export const metadata = pageMeta({
  title: "Privacy Policy — SEOHub",
  description:
    "How SEOHub handles public-site scans, on-device history, shared reports, analytics, and advertising. Clear privacy details — no account required to scan.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        description="Last updated: July 2026"
      />
      <article className="mx-auto mt-10 max-w-2xl space-y-6 px-4 text-ink-muted sm:px-6">
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">What we collect</h2>
          <p className="mt-2 leading-relaxed">
            When you scan a URL, we fetch that <strong className="font-medium text-ink">public</strong>{" "}
            website (HTML, robots.txt, sitemap, DNS/SSL where available) and analyze it. We do not
            ask for your email, name, phone number, or other private account details.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Anonymized scan insights</h2>
          <p className="mt-2 leading-relaxed">
            We may store aggregated facts about public websites that are scanned — for example
            hostname, TLD, category scores, and issue counts — in private infrastructure (Neon /
            Vercel Postgres, or optionally KV/Firebase). This data is not published on a public
            leaderboard. We may use it internally or license <em>aggregated market insights</em>{" "}
            derived from public-website scans. This is not personal profile data.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Shared reports</h2>
          <p className="mt-2 leading-relaxed">
            If you use “Copy share link,” a snapshot of that scan report may be stored so anyone with
            the link can view it. Shared report pages are marked noindex. Do not share reports that
            contain sensitive internal URLs.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">
            On-device history &amp; watchlist
          </h2>
          <p className="mt-2 leading-relaxed">
            Recent scans and your watchlist are saved in your browser&apos;s local storage so you can
            re-check sites without creating an account. Clearing site data removes them. That data
            stays on your device.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Advertising</h2>
          <p className="mt-2 leading-relaxed">
            We may show small third-party ads (for example Google AdSense). Ad partners may use
            cookies or similar technologies as described in their policies. You can control cookies
            via our consent banner and your browser settings.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Analytics</h2>
          <p className="mt-2 leading-relaxed">
            We use Vercel Web Analytics to understand traffic (page views, performance).
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Third-party services</h2>
          <p className="mt-2 leading-relaxed">
            Optional integrations (Google PageSpeed, DataForSEO, AdSense) may receive the public URL
            you submit when those features are enabled.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Email (optional)</h2>
          <p className="mt-2 leading-relaxed">
            If you use “Email report” or weekly watchlist digests, we send mail via Resend to the
            address you provide. Digest subscribers are stored so we can send reminders; every digest
            includes an unsubscribe link. We do not require email to use the free scanner or tools.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Payments</h2>
          <p className="mt-2 leading-relaxed">
            Optional paid unlocks (for example a full-site SEO scan) are processed by Stripe. We do
            not store your card details. Stripe may process payment information under its own
            privacy policy. An unlock token may be saved in your browser so you can re-run full
            scans without paying again during the unlock window.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Accounts</h2>
          <p className="mt-2 leading-relaxed">
            SEOHub does not require an account. There is no login, email signup, or user profile
            database.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Contact</h2>
          <p className="mt-2 leading-relaxed">
            Questions? See our{" "}
            <Link href={routes.about} className="text-teal hover:underline">
              About
            </Link>{" "}
            page.
          </p>
        </section>
      </article>
    </main>
  );
}
