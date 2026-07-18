import Link from "next/link";
import { notFound } from "next/navigation";
import { getSharedReport } from "@/lib/reports";
import { getSampleReport, SAMPLE_REPORT_ID } from "@/lib/sample-report";
import { SharedReportView } from "@/components/SharedReportView";
import { PageHero, PrimaryCta } from "@/components/ui/PageHero";
import { routes } from "@/lib/routes";
import type { AuditReport } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

async function loadReport(id: string): Promise<AuditReport | null> {
  if (id === SAMPLE_REPORT_ID) return getSampleReport();
  if (!/^[a-f0-9]{12}$/i.test(id)) return null;
  return getSharedReport(id).catch(() => null);
}

export async function generateMetadata({ params }: PageProps) {
  const report = await loadReport(params.id);
  if (!report) return { title: "Report not found — SEOHub" };
  const isSample = params.id === SAMPLE_REPORT_ID;
  let host = "site";
  try {
    host = new URL(report.url).hostname;
  } catch {
    // ignore
  }
  return {
    title: isSample ? "Sample SEO report — SEOHub" : `SEOHub report — ${host}`,
    description: isSample
      ? "Public sample of an SEOHub full-site audit with crawl coverage and fix recommendations."
      : `Shared SEOHub audit for ${host}`,
    robots: isSample ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function SharedReportPage({ params }: PageProps) {
  const report = await loadReport(params.id);
  if (!report) notFound();

  const isSample = params.id === SAMPLE_REPORT_ID;

  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow={isSample ? "Sample report" : "Shared report"}
        title={isSample ? "See what a full SEOHub audit looks like" : "SEOHub results"}
        description={
          isSample
            ? "Demo data for example.com — scores, crawl coverage, URL grouping, and fixes."
            : "Read-only snapshot of a full site audit."
        }
        actions={<PrimaryCta href={routes.home}>Run your own free scan</PrimaryCta>}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="mt-6 text-sm text-ink-muted">
          {isSample ? (
            <>
              This is sample data for demos.{" "}
              <Link href={routes.home} className="text-teal hover:underline">
                Scan your site
              </Link>{" "}
              for a live report.
            </>
          ) : (
            <>
              Or{" "}
              <Link href={routes.guides} className="text-teal hover:underline">
                browse fix guides
              </Link>
              .
            </>
          )}
        </p>
        <SharedReportView report={report} shareId={params.id} />
      </div>
    </main>
  );
}
