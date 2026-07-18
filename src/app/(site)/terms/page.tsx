import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { routes } from "@/lib/routes";

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
            SEOHub is a free tool for scanning public websites. You may only audit URLs you own or
            have permission to test. Do not use this service to attack, overload, or scrape sites
            without authorization.
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
