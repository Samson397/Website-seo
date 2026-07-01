import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 pt-8 text-sm text-slate-600">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <nav className="flex flex-wrap justify-center gap-4">
          <Link href="/about" className="hover:text-blue-600">
            About
          </Link>
          <Link href="/privacy" className="hover:text-blue-600">
            Privacy Policy
          </Link>
          <a
            href="https://github.com/Samson397/Website-seo"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600"
          >
            GitHub
          </a>
        </nav>
        <p className="text-center text-slate-400">
          Free SEO scan — no login required
        </p>
      </div>
    </footer>
  );
}
