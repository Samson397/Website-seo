import Link from "next/link";
import { PageHero, PrimaryCta, SecondaryCta } from "@/components/ui/PageHero";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/brand";
import { routes } from "@/lib/routes";

export const metadata = {
  title: "Contact SEOHub support — help & refunds",
  description:
    "Contact SEOHub support for payment help, refunds when we fail to deliver a paid unlock, or product questions about scans and free tools. No account required.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow="Support"
        title="Contact SEOHub"
        description="Questions about a scan, payment, or unlock? Email us — we read every message."
        actions={
          <>
            <PrimaryCta href={SUPPORT_MAILTO}>Email {SUPPORT_EMAIL}</PrimaryCta>
            <SecondaryCta href={routes.pricing}>See pricing</SecondaryCta>
          </>
        }
      />

      <article className="mx-auto mt-12 max-w-2xl space-y-8 px-4 text-ink-muted sm:px-6">
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">How to reach us</h2>
          <p className="mt-2 leading-relaxed">
            Email{" "}
            <a href={SUPPORT_MAILTO} className="font-medium text-teal hover:underline">
              {SUPPORT_EMAIL}
            </a>
            . Include your site URL and Stripe receipt email if the message is about a payment.
            Typical topics: unlock not applying, double charges, crawl errors on a public URL, or
            questions about free tools.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">What to include</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed">
            <li>The URL you scanned or tried to unlock</li>
            <li>Approximate time of the payment (and receipt email)</li>
            <li>Browser and whether you cleared site data after checkout</li>
            <li>A short description of what you expected vs what happened</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Refunds</h2>
          <p className="mt-2 leading-relaxed">
            Once a full-site unlock is delivered successfully, the fee is non-refundable. We refund
            duplicate charges and cases where payment succeeded but we failed to deliver the report.
            See{" "}
            <Link href={routes.terms} className="text-teal hover:underline">
              Terms
            </Link>{" "}
            for details, or start on{" "}
            <Link href={routes.pricing} className="text-teal hover:underline">
              Pricing
            </Link>{" "}
            for what one payment covers.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Product questions</h2>
          <p className="mt-2 leading-relaxed">
            For how scans work, HTML-only crawling, or how we differ from research suites, read{" "}
            <Link href={routes.about} className="text-teal hover:underline">
              About
            </Link>{" "}
            and the{" "}
            <Link href={routes.compare} className="text-teal hover:underline">
              comparison pages
            </Link>
            . Free tools and guides do not require an account.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Security</h2>
          <p className="mt-2 leading-relaxed">
            Vulnerability reports: use{" "}
            <a href="mailto:security@seohub.online" className="text-teal hover:underline">
              security@seohub.online
            </a>{" "}
            (also listed in{" "}
            <Link href="/.well-known/security.txt" className="text-teal hover:underline">
              security.txt
            </Link>
            ).
          </p>
        </section>
      </article>
    </main>
  );
}
