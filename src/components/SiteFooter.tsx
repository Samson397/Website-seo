import Link from "next/link";
import { routes } from "@/lib/routes";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-ink py-10 text-white/70">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <p className="font-display text-sm font-semibold text-white">SEOHub</p>
        <nav className="flex flex-wrap justify-center gap-5 text-xs">
          <Link href={routes.history} className="hover:text-teal-bright">
            History
          </Link>
          <Link href={routes.tools} className="hover:text-teal-bright">
            Tools
          </Link>
          <Link href={routes.guides} className="hover:text-teal-bright">
            Guides
          </Link>
          <Link href={routes.about} className="hover:text-teal-bright">
            About
          </Link>
          <Link href={routes.privacy} className="hover:text-teal-bright">
            Privacy
          </Link>
          <Link href={routes.terms} className="hover:text-teal-bright">
            Terms
          </Link>
        </nav>
        <p className="text-xs text-white/40">Free weekly site check · No account</p>
      </div>
    </footer>
  );
}
