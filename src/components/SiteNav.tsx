"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav, routes } from "@/lib/routes";
import { LogoMark } from "@/components/LogoMark";

interface SiteNavProps {
  variant?: "default" | "hero";
}

export function SiteNav({ variant = "default" }: SiteNavProps) {
  const pathname = usePathname();
  const isHero = variant === "hero";

  return (
    <header
      className={
        isHero
          ? "absolute inset-x-0 top-0 z-20"
          : "sticky top-0 z-30 border-b border-ink/10 bg-white/90 backdrop-blur-md"
      }
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-lg"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 pt-4 sm:px-6 lg:px-8">
        <Link
          href={routes.home}
          className="flex items-center gap-2.5"
          aria-label="SEOHub home"
        >
          <LogoMark size="sm" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {mainNav.map((item) => {
            const href = item.href;
            const active =
              pathname === href || (href !== routes.home && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`relative px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "text-ink after:absolute after:inset-x-3 after:bottom-0.5 after:h-[2px] after:rounded-full after:bg-teal"
                    : isHero
                      ? "text-ink/65 hover:text-ink"
                      : "text-ink-muted hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden w-8 lg:block" aria-hidden />
      </div>

      <nav
        className={`mx-auto flex max-w-7xl gap-0.5 overflow-x-auto px-4 pb-0 pt-2 sm:px-6 lg:hidden lg:px-8 ${
          isHero ? "" : "border-t border-ink/5"
        }`}
        aria-label="Main mobile"
      >
        {mainNav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== routes.home && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative shrink-0 px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "text-ink after:absolute after:inset-x-2 after:bottom-0 after:h-[2px] after:rounded-full after:bg-teal"
                  : isHero
                    ? "text-ink/60 hover:text-ink"
                    : "text-ink-muted hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
