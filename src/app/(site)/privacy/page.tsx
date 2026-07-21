import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/brand";
import { routes } from "@/lib/routes";

export const metadata = {
  title: "Privacy Policy — SEOHub",
  description:
    "How SEOHub handles scan data, cookies, optional accounts, Google services, payments, and email. Read before you scan or sign in.",
  alternates: { canonical: "/privacy" },
};

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
            website (HTML, robots.txt, sitemap, DNS/SSL where available) and analyze it. Basic use of
            the free scanner does not require your name or password.
          </p>
          <p className="mt-2 leading-relaxed">
            If you create an account, sign in with Google, email a report, subscribe to digests, or
            pay for an unlock, we also process the details needed for that feature (for example email
            address, Google account identifiers you authorize, or payment confirmation from Stripe).
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Accounts &amp; Google sign-in</h2>
          <p className="mt-2 leading-relaxed">
            SEOHub may offer optional accounts so you can save sites, history, or connect Google
            services. If you use <strong className="font-medium text-ink">Sign in with Google</strong>{" "}
            (or connect Google Search Console later), Google authenticates you and may share with us
            basic profile data you approve — typically name, email address, and a Google account ID.
            We use that to create or link your SEOHub account and, if you grant extra scopes, to read
            Search Console data for properties you choose.
          </p>
          <p className="mt-2 leading-relaxed">
            We do not receive your Google password. You can revoke SEOHub&apos;s access in your{" "}
            <a
              href="https://myaccount.google.com/permissions"
              className="text-teal hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              Google Account permissions
            </a>
            . Google&apos;s own processing is described in the{" "}
            <a
              href="https://policies.google.com/privacy"
              className="text-teal hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              Google Privacy Policy
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Anonymized scan insights</h2>
          <p className="mt-2 leading-relaxed">
            We may store aggregated facts about public websites that are scanned — for example
            hostname, TLD, category scores, and issue counts — in private infrastructure (Neon /
            Vercel Postgres, or optionally KV/Firebase). This data is not published on a public
            leaderboard. We may use it internally or license <em>aggregated market insights</em>{" "}
            derived from public-website scans. This is not a personal profile by itself.
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
            Recent scans and your watchlist may be saved in your browser&apos;s local storage so you
            can re-check sites without signing in. Clearing site data removes them. If you use an
            account, some history may also be stored on our servers so it follows you across devices.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Advertising</h2>
          <p className="mt-2 leading-relaxed">
            We may show third-party ads via <strong className="font-medium text-ink">Google AdSense</strong>.
            Google and its partners may use cookies or similar technologies to serve and measure ads,
            including personalized ads where allowed. See{" "}
            <a
              href="https://policies.google.com/technologies/ads"
              className="text-teal hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              How Google uses cookies in advertising
            </a>
            . You can control non-essential cookies via our consent banner and your browser or Google
            ad settings.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Analytics</h2>
          <p className="mt-2 leading-relaxed">
            We use <strong className="font-medium text-ink">Vercel Web Analytics</strong> for page
            views and performance. After you accept analytics cookies, we may also store first-party
            visitor events (for example page path, approximate country from the hosting edge,
            device/browser class, and anonymous visitor IDs) so we can operate and improve SEOHub.
            Essential-only consent skips that first-party tracking.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Google &amp; other scan APIs</h2>
          <p className="mt-2 leading-relaxed">
            When enabled, optional scan features may send the <strong className="font-medium text-ink">public URL</strong>{" "}
            you submit to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong className="font-medium text-ink">Google PageSpeed Insights</strong> — Core Web
              Vitals / Lighthouse-style metrics
            </li>
            <li>
              <strong className="font-medium text-ink">DataForSEO</strong> — optional backlinks,
              keyword volume, or rank checks
            </li>
          </ul>
          <p className="mt-2 leading-relaxed">
            Those providers process the URL under their own terms. We do not send your Google login
            password to them.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">AI features</h2>
          <p className="mt-2 leading-relaxed">
            Optional AI features (for example an SEO fix plan) may send relevant parts of a scan
            report to our AI provider (currently DeepSeek) to generate recommendations. Do not paste
            secrets into scanned pages or prompts. AI output is informational and may be incomplete.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Email (optional)</h2>
          <p className="mt-2 leading-relaxed">
            If you use “Email report,” weekly digests, or account notifications, we send mail via
            Resend to the address you provide (or the email on your Google account). Digest
            subscribers are stored so we can send reminders; digests include an unsubscribe link.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Payments</h2>
          <p className="mt-2 leading-relaxed">
            Paid unlocks and any future subscriptions are processed by Stripe. We do not store your
            full card details. Stripe processes payment data under its own privacy policy. After a
            successful one-time unlock, a session may be saved in your browser (and, if you have an
            account, linked to it) so you can complete that scan.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Cookies &amp; similar tech</h2>
          <p className="mt-2 leading-relaxed">
            We use essential cookies for security and basic operation (for example admin or session
            cookies when signed in). Analytics and advertising cookies run only after you accept them
            (or as otherwise allowed by law). You can change your choice by clearing site data and
            revisiting the consent banner.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Contact</h2>
          <p className="mt-2 leading-relaxed">
            Questions or data requests? Email{" "}
            <a href={SUPPORT_MAILTO} className="text-teal hover:underline">
              {SUPPORT_EMAIL}
            </a>{" "}
            or visit{" "}
            <Link href={routes.contact} className="text-teal hover:underline">
              Contact
            </Link>
            .
          </p>
        </section>
      </article>
    </main>
  );
}
