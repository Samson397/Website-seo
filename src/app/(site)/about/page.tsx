import Link from "next/link";
import { PageHero, PrimaryCta, SecondaryCta } from "@/components/ui/PageHero";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/brand";
import { routes } from "@/lib/routes";

export const metadata = {
  title: "About — SEOHub",
  description:
    "Why SEOHub exists: full-site SEO audits, free tools, and a pay-per-scan unlock — built for founders who want clear fixes without another SaaS login.",
  alternates: { canonical: "/about" },
};

const WHO_FOR = [
  "Founders shipping a marketing site who need a clear fix list before launch",
  "Marketers who audit occasionally — not every day — and don’t want another subscription",
  "Anyone who wants Pass/Fail checks, exports, and free tools without creating an account",
];

export default function AboutPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Does SEOHub require an account?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Run a free homepage preview without signing up. Pay once when you need a full-site crawl.",
        },
      },
      {
        "@type": "Question",
        name: "How is SEOHub different from Ahrefs or Semrush?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ahrefs and Semrush win on backlink graphs and enterprise research. SEOHub is a browser-first weekly audit: clear Pass/Fail fixes, pay-per-scan pricing, and tools without login walls.",
        },
      },
      {
        "@type": "Question",
        name: "Do you render JavaScript-heavy apps?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Scans fetch public HTML (not a full browser render). That keeps SEOHub fast and honest about JS-heavy apps.",
        },
      },
    ],
  };

  return (
    <main className="min-h-screen pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <PageHero
        eyebrow="About SEOHub"
        title="A weekly site check, without the SaaS."
        description="SEOHub crawls public HTML and runs clear checks — free to start, no account, pay once when you need the deep crawl."
        actions={
          <>
            <PrimaryCta href={routes.home}>Run a free scan</PrimaryCta>
            <SecondaryCta href={routes.contact}>Contact us</SecondaryCta>
          </>
        }
      />

      <article className="mx-auto mt-12 max-w-3xl space-y-12 px-4 text-ink-muted sm:px-6">
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Why SEOHub exists</h2>
          <p className="mt-2 leading-relaxed">
            Most small sites do not need a forever SEO dashboard. They need a clear list of what is
            broken, a crawl that covers real pages, and a reason to fix things this week — not
            another login to ignore. SEOHub is built for that job: free homepage scores (including
            AI visibility), then a one-time unlock for a full-site crawl with Pass/Fail checks,
            exports, and plain-English fixes.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Who it is for</h2>
          <ul className="mt-4 space-y-2">
            {WHO_FOR.map((item) => (
              <li key={item} className="flex gap-2 text-sm">
                <span className="text-brand">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">How it works</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed">
            <li>Paste a public URL for a free homepage score preview (SEO, speed, a11y, security, AI).</li>
            <li>Unlock once to expand into a full-site crawl (up to 200 pages) with checklist and fixes.</li>
            <li>Export, share, or email the report — no account required.</li>
          </ol>
          <p className="mt-3 text-sm leading-relaxed">
            Scans use fetched HTML (not a full browser render). That keeps SEOHub fast and cheap —
            and honest about JS-heavy apps.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Built to beat bloated SEO suites</h2>
          <p className="mt-2 leading-relaxed">
            Ahrefs and Semrush win on backlink graphs and enterprise research. Screaming Frog wins on
            desktop crawl control. SEOHub aims to be the #1 browser-first weekly audit: clear
            Pass/Fail, freemium unlock, and a toolkit that ships without login walls.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Contact</h2>
          <p className="mt-2 leading-relaxed">
            Email{" "}
            <a href={SUPPORT_MAILTO} className="text-teal hover:underline">
              {SUPPORT_EMAIL}
            </a>{" "}
            or visit our{" "}
            <Link href={routes.contact} className="text-teal hover:underline">
              Contact
            </Link>{" "}
            page. Payment and refund rules are in{" "}
            <Link href={routes.terms} className="text-teal hover:underline">
              Terms
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Also free</h2>
          <ul className="mt-3 space-y-2">
            {[
              { href: routes.sampleReport, label: "Sample full report" },
              { href: routes.competitors, label: "Competitor compare" },
              { href: routes.metaPreview, label: "Meta & SERP preview" },
              { href: routes.redirects, label: "Redirect chain checker" },
              { href: routes.schema, label: "JSON-LD schema inspector" },
              { href: routes.brokenLinks, label: "Broken link checker" },
              { href: routes.guides, label: "Fix guides" },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-brand hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </main>
  );
}
