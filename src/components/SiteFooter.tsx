import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";
import { routes } from "@/lib/routes";

const FOOTER_LINKS = [
  { href: routes.pricing, label: "Pricing" },
  { href: routes.tools, label: "Tools" },
  { href: routes.guides, label: "Guides" },
  { href: routes.about, label: "About" },
  { href: routes.privacy, label: "Privacy" },
  { href: routes.terms, label: "Terms" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-ink py-12 text-white/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <Link href={routes.home} className="flex items-center gap-2.5 text-white">
            <LogoMark size="sm" />
            <span className="font-display text-lg font-semibold tracking-tight">SEOHub</span>
          </Link>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
            {FOOTER_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-brand-bright">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="text-xs text-white/40">
          Full-site SEO audits, keyword tools, and technical checkers — free to start, no account.
        </p>
      </div>
    </footer>
  );
}
