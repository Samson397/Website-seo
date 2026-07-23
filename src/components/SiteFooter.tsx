import Link from "next/link";
import { routes } from "@/lib/routes";

const FOOTER_LINKS = [
  { href: routes.pricing, label: "Pricing" },
  { href: routes.tools, label: "Tools" },
  { href: routes.compare, label: "Comparisons" },
  { href: routes.blog, label: "Blog" },
  { href: routes.guides, label: "Guides" },
  { href: routes.technicalSeoChecklist, label: "Technical SEO Checklist" },
  { href: routes.about, label: "About" },
  { href: routes.contact, label: "Contact" },
  { href: routes.privacy, label: "Privacy" },
  { href: routes.terms, label: "Terms" },
] as const;

/** Text brand in footer — avoids lazy logo image CLS flagged by PageSpeed. */
export function SiteFooter() {
  return (
    <footer className="border-t border-ink/12 bg-ink py-12 text-white/65">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <Link
            href={routes.home}
            className="font-display text-lg font-extrabold tracking-tight text-white"
            aria-label="SEOHub home"
          >
            SEOHub
          </Link>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
            {FOOTER_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="text-xs text-white/45">
          Full-site SEO audits, keyword tools, and technical checkers — free to start, no account.
        </p>
      </div>
    </footer>
  );
}
