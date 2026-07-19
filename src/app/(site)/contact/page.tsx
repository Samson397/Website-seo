import Link from "next/link";
import { PageHero, PrimaryCta, SecondaryCta } from "@/components/ui/PageHero";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/brand";
import { routes } from "@/lib/routes";

export const metadata = {
  title: "Contact — SEOHub",
  description:
    "Contact SEOHub support for payment help, refunds when we fail to deliver, or product questions. No account required.",
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
          </p>
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
            for details.
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
