import Link from "next/link";
import { PageHero, PrimaryCta, SecondaryCta } from "@/components/ui/PageHero";
import { PromoCodesBoard } from "@/components/PromoCodesBoard";
import { routes } from "@/lib/routes";
import { FULL_SCAN_PRICE_LABEL } from "@/lib/stripe-public";

export const metadata = {
  title: "Pricing — SEOHub",
  description: `Free SEO score preview with AI visibility. Unlock one full-site crawl and complete fixes for ${FULL_SCAN_PRICE_LABEL} — no subscription and no account required.`,
  alternates: { canonical: "/pricing" },
};

const FREE = [
  "Homepage scores out of 10 (SEO, speed, a11y, security, AI)",
  "AI visibility / GEO readiness check",
  "Top issue titles; full fixes on unlock",
  "Google SERP preview",
  "Keyword research & free toolkit",
  "On-device history & watchlist",
];

const PAID = [
  "One full-site scan per payment (not a monthly pass)",
  "Unlock this report in place — then expand to full crawl",
  "Full issue details, recommendations, and fix snippets",
  "Complete Pass / Fail / Review checklist",
  "Full-site crawl up to 200 pages + crawl controls",
  "Site-wide duplicate / thin / canonical / hreflang issues",
  "Domain, DNS, SSL & tech overview",
  "CSV / JSON / PDF export + shareable report link",
  "AI priority fix plan + draft llms.txt (when DeepSeek is configured)",
  "Email report when Resend is configured",
  "Opt-in site spotlight on the SEOHub blog (homepage link; needs Neon)",
];

const FAQS = [
  {
    q: "What does one payment cover?",
    a: `One ${FULL_SCAN_PRICE_LABEL} payment unlocks one full-site scan — fixes for that report, a crawl of up to 200 pages, exports, and a share link. Another site or another crawl later needs another payment.`,
  },
  {
    q: "Can I get a refund?",
    a: "If the unlock and report were delivered successfully, the fee is non-refundable. We refund duplicate charges or cases where we failed to deliver after payment. See Terms for details.",
  },
  {
    q: "Do you fully render JavaScript sites?",
    a: "No. We fetch public HTML. That keeps scans fast and honest — JS-only apps may show fewer on-page signals.",
  },
  {
    q: "Do I need an account?",
    a: "No. Free tools and homepage previews work without signup. Payments run through Stripe Checkout.",
  },
];

export default function PricingPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <main className="min-h-screen pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <PageHero
        eyebrow="SEOHub pricing"
        title={<>Free preview. {FULL_SCAN_PRICE_LABEL} for the full report.</>}
        description="No account. No subscription. Pay once per full-site scan — unlock that report, then crawl up to 200 pages."
        actions={
          <>
            <PrimaryCta href={routes.home}>Start free preview</PrimaryCta>
            <SecondaryCta href={routes.sampleReport}>View sample report</SecondaryCta>
          </>
        }
      />

      <div className="mx-auto mt-12 grid max-w-5xl gap-12 px-4 sm:grid-cols-2 sm:px-6">
        <Plan
          label="Free"
          price="$0"
          note="Score teaser only"
          items={FREE}
          cta={{ href: routes.home, label: "Run free preview" }}
        />
        <Plan
          label="Full SEO"
          price={FULL_SCAN_PRICE_LABEL}
          note="One-time unlock · Stripe Checkout · no account"
          items={PAID}
          featured
          cta={{ href: routes.home, label: "Scan, then unlock" }}
        />
      </div>

      <p className="mx-auto mt-8 max-w-5xl px-4 text-center text-sm text-ink-muted sm:px-6">
        By unlocking you agree to our{" "}
        <Link href={routes.terms} className="text-brand hover:underline">
          Terms
        </Link>{" "}
        (digital delivery is immediate; non-refundable after successful unlock except delivery
        failures).{" "}
        <Link href={routes.contact} className="text-brand hover:underline">
          Contact support
        </Link>{" "}
        if something goes wrong.
      </p>

      <section className="mx-auto mt-16 max-w-5xl px-4 sm:px-6">
        <PromoCodesBoard />
      </section>

      <section className="mx-auto mt-16 max-w-3xl px-4 sm:px-6">
        <h2 className="font-display text-center text-2xl font-semibold text-ink">FAQ</h2>
        <dl className="mt-8 space-y-6">
          {FAQS.map((item) => (
            <div key={item.q}>
              <dt className="font-display text-lg font-semibold text-ink">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-ink-muted">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto mt-16 max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-display text-2xl font-semibold text-ink">What you get after unlock</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
          Each payment covers <span className="font-semibold text-ink">one full-site scan</span> —
          unlock that report’s fixes, run the crawl (up to 200 pages), export, and share. Want
          another site later? Pay again. Free homepage previews stay free.
        </p>
        <p className="mt-4 text-sm text-ink-muted">
          Prefer the toolkit only?{" "}
          <Link href={routes.tools} className="font-medium text-brand hover:underline">
            Free tools stay free
          </Link>
          .
        </p>
      </section>
    </main>
  );
}

function Plan({
  label,
  price,
  note,
  items,
  cta,
  featured,
}: {
  label: string;
  price: string;
  note: string;
  items: string[];
  cta: { href: string; label: string };
  featured?: boolean;
}) {
  return (
    <section className={`border-t-2 pt-6 ${featured ? "border-brand" : "border-ink/10"}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">{label}</p>
      <p className="font-display mt-2 text-4xl font-semibold text-ink">{price}</p>
      <p className="mt-1 text-sm text-ink-muted">{note}</p>
      <ul className="mt-6 space-y-2.5 text-sm text-ink-muted">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-brand">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <Link
        href={cta.href}
        className={`mt-8 inline-flex rounded-xl px-5 py-2.5 text-sm font-semibold ${
          featured
            ? "bg-brand text-white hover:bg-brand-bright"
            : "border border-ink/10 bg-white text-ink hover:border-brand/40"
        }`}
      >
        {cta.label}
      </Link>
    </section>
  );
}
