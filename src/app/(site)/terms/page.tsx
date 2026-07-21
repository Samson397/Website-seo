import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { FULL_SCAN_PRICE_LABEL } from "@/lib/stripe-public";

export const metadata = {
  title: "Terms of Service — SEOHub",
  description:
    "Terms of service for SEOHub audits, tools, optional accounts, Google connections, and paid scans.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen pb-16">
      <PageHero eyebrow="Legal" title="Terms of Service" description="Last updated: July 2026" />
      <article className="mx-auto mt-10 max-w-2xl space-y-6 px-4 text-ink-muted sm:px-6">
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Using SEOHub</h2>
          <p className="mt-2 leading-relaxed">
            SEOHub provides free homepage SEO previews, free tools, optional accounts, and paid
            full-site scans (and may offer subscriptions later). You may only audit URLs you own or
            have permission to test. Do not use this service to attack, overload, or scrape sites
            without authorization.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Accounts &amp; Google</h2>
          <p className="mt-2 leading-relaxed">
            An account is optional for basic scanning. If you create an account or use{" "}
            <strong className="font-medium text-ink">Sign in with Google</strong>, you must provide
            accurate details and keep access secure. You are responsible for activity under your
            account.
          </p>
          <p className="mt-2 leading-relaxed">
            Connecting Google (for example Search Console) is optional. You grant only the
            permissions you approve in Google&apos;s consent screen. You can revoke access in your
            Google Account settings. We may suspend accounts that abuse the service or violate these
            terms.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Payments</h2>
          <p className="mt-2 leading-relaxed">
            A paid one-time unlock ({FULL_SCAN_PRICE_LABEL} unless otherwise shown) covers{" "}
            <strong className="font-medium text-ink">one full-site scan</strong> — unlocking that
            report’s fixes, crawling up to 200 pages, exports, and share links where offered. Digital
            delivery starts after successful payment. If we introduce subscriptions, pricing and
            renewal terms will be shown at checkout.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">AI features</h2>
          <p className="mt-2 leading-relaxed">
            AI-generated plans, copy, or recommendations are informational tools. You remain
            responsible for reviewing and applying any changes to your website. We do not guarantee
            ranking improvements from following AI suggestions.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Refunds</h2>
          <p className="mt-2 leading-relaxed">
            Once an unlock succeeds and the full report or crawl is delivered, the one-time fee is{" "}
            <strong className="font-medium text-ink">non-refundable</strong>. Dissatisfaction with
            scores or search rankings is not grounds for a refund — results are informational only.
          </p>
          <p className="mt-2 leading-relaxed">
            We will refund (or provide a free re-unlock) if you were charged twice for one unlock,
            or if payment succeeded but we failed to deliver the report due to our error or outage.
            Contact{" "}
            <a href={SUPPORT_MAILTO} className="text-teal hover:underline">
              {SUPPORT_EMAIL}
            </a>{" "}
            with your receipt details. Subscription refunds, if applicable, follow the terms shown at
            purchase.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Acceptable use</h2>
          <p className="mt-2 leading-relaxed">
            Do not abuse rate limits, attempt to bypass payment for full crawls, automate account
            creation for abuse, or submit private / internal network URLs. We may throttle or block
            abusive traffic.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">No warranty</h2>
          <p className="mt-2 leading-relaxed">
            Results are provided for informational purposes only. We do not guarantee accuracy,
            completeness, or that fixing reported issues will improve search rankings or security.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Availability</h2>
          <p className="mt-2 leading-relaxed">
            The service is offered as-is. We may change, limit, or discontinue features at any time
            without notice. Rate limits may apply to protect the service.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Privacy</h2>
          <p className="mt-2 leading-relaxed">
            How we handle data is described in our{" "}
            <Link href={routes.privacy} className="text-teal hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Contact</h2>
          <p className="mt-2 leading-relaxed">
            Questions? Email{" "}
            <a href={SUPPORT_MAILTO} className="text-teal hover:underline">
              {SUPPORT_EMAIL}
            </a>{" "}
            or see{" "}
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
