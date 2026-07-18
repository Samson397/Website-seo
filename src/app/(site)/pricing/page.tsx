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
  "AI visibility check — will assistants promote you?",
  "Issue counts + a few locked issue titles",
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

export default function PricingPage() {
  return (
    <main className="min-h-screen pb-20">
      <PageHero
        eyebrow="SEOHub pricing"
        title={<>Free preview. {FULL_SCAN_PRICE_LABEL} for the full report.</>}
        description="No account. No subscription. Pay once per full-site scan — unlock that report, then crawl up to 200 pages."
        actions={
          <>
            <PrimaryCta href={routes.home}>Start free preview</PrimaryCta>
            <SecondaryCta href={routes.tools}>Browse free tools</SecondaryCta>
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
          note="One-time unlock · Stripe Checkout"
          items={PAID}
          featured
          cta={{ href: routes.home, label: "Scan, then unlock" }}
        />
      </div>

      <section className="mx-auto mt-16 max-w-5xl px-4 sm:px-6">
        <PromoCodesBoard />
      </section>

      <section className="mx-auto mt-16 max-w-3xl px-4 sm:px-6">
        <h2 className="font-display text-2xl font-semibold text-ink">What you get after unlock</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
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
