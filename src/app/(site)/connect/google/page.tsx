import { PageHero } from "@/components/ui/PageHero";
import { pageMetadata } from "@/lib/page-seo";
import { GoogleConnectClient } from "./GoogleConnectClient";

export const metadata = pageMetadata({
  title: "Connect Google — SEOHub",
  description:
    "Optionally connect Google Search Console to pull clicks, impressions, and queries for sites you own. Audits still work without it.",
  path: "/connect/google",
});

export default function ConnectGooglePage({
  searchParams,
}: {
  searchParams?: { ok?: string; error?: string; email?: string };
}) {
  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow="Optional"
        title="Connect Google Search Console"
        description="Audits never need this. Connect only when you want private search performance data for properties you verify in Google."
      />
      <div className="mx-auto max-w-xl px-4 sm:px-6">
        <GoogleConnectClient
          ok={searchParams?.ok === "1"}
          error={searchParams?.error}
          email={searchParams?.email}
        />
      </div>
    </main>
  );
}
