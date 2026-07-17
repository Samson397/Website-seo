import Link from "next/link";
import { routes } from "@/lib/routes";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal">SEOScan</p>
      <h1 className="font-display mt-3 text-3xl font-semibold text-ink sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-sm text-ink-muted">
        That URL isn’t on this site. Run a scan or open a free tool instead.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href={routes.home}
          className="rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-bright"
        >
          Free scan
        </Link>
        <Link
          href={routes.tools}
          className="rounded-xl border border-ink/10 bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:border-teal/40"
        >
          Tools
        </Link>
      </div>
    </main>
  );
}
