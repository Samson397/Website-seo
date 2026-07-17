import Link from "next/link";
import { notFound } from "next/navigation";
import { getSharedReport } from "@/lib/reports";
import { SharedReportView } from "@/components/SharedReportView";
import { PageHero, PrimaryCta } from "@/components/ui/PageHero";
import { routes } from "@/lib/routes";
import { formatUrlDisplay } from "@/lib/url-display";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps) {
  const report = await getSharedReport(params.id).catch(() => null);
  if (!report) return { title: "Report not found — SEOHub" };
  let host = "site";
  try {
    host = new URL(report.url).hostname;
  } catch {
    // ignore
  }
  return {
    title: `SEOHub report — ${host}`,
    description: `Shared SEOHub audit for ${host}`,
    robots: { index: false, follow: false },
  };
}

export default async function SharedReportPage({ params }: PageProps) {
  const report = await getSharedReport(params.id).catch(() => null);
  if (!report) notFound();

  let host = formatUrlDisplay(report.url);
  try {
    host = new URL(report.url).hostname;
  } catch {
    /* keep */
  }

  const overall = Math.round(
    (report.scores.seo +
      report.scores.performance +
      report.scores.accessibility +
      report.scores.security) /
      4
  );

  return (
    <main className="min-h-screen pb-16">
      <PageHero
        eyebrow="Shared report"
        title={<>{host}</>}
        description={`Overall score ${overall}. Read-only snapshot of a SEOHub site audit.`}
        actions={<PrimaryCta href={routes.home}>Run your own free scan</PrimaryCta>}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="mt-6 text-sm text-ink-muted">
          Or{" "}
          <Link href={routes.guides} className="text-brand hover:underline">
            browse fix guides
          </Link>
          .
        </p>
        <SharedReportView report={report} shareId={params.id} />
      </div>
    </main>
  );
}
