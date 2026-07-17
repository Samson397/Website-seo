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
    <footer className="border-t border-white/8 bg-ink py-14 text-white/55">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
          <div>
            <Link href={routes.home} className="flex items-center gap-2.5 text-white">
              <LogoMark size="sm" />
              <span className="font-display text-xl font-semibold tracking-tight">SEOHub</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/40">
              Full-site SEO audits and a toolkit built for clear fixes — not another subscription.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {FOOTER_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition hover:text-brand-bright"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
