import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { FULL_SCAN_PRICE_LABEL } from "@/lib/stripe-public";

export const metadata = {
  title: "Terms of Service — SEOHub",
  description:
    "Terms of service for using SEOHub audits, free tools, and paid full-site scans. Please read before purchasing an unlock.",
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
            SEOHub provides free homepage SEO previews, free tools, and optional paid full-site
            scans. You may only audit URLs you own or have permission to test. Do not use this
            service to attack, overload, or scrape sites without authorization.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Payments</h2>
          <p className="mt-2 leading-relaxed">
            A paid unlock ({FULL_SCAN_PRICE_LABEL} unless otherwise shown) covers{" "}
            <strong className="font-medium text-ink">one full-site scan</strong> — unlocking that
            report’s fixes, crawling up to 200 pages, exports, and share links. Digital delivery
            starts immediately after successful payment. There is no subscription and no account.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Refunds</h2>
          <p className="mt-2 leading-relaxed">
            Once an unlock succeeds and the full report or crawl is delivered, the fee is{" "}
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
            with your receipt details.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Acceptable use</h2>
          <p className="mt-2 leading-relaxed">
            Do not abuse rate limits, attempt to bypass payment for full crawls, or submit private /
            internal network URLs. We may throttle or block abusive traffic.
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
