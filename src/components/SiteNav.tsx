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
          ? "absolute inset-x-0 top-0 z-20 px-4 pt-5 sm:px-6"
          : "border-b border-ink/10 bg-white/90 backdrop-blur-md"
      }
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link
          href={routes.home}
          className="flex items-center gap-2.5"
          aria-label="SEOHub home"
        >
          <LogoMark size="sm" />
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {mainNav.map((item) => {
            const href = item.href;
            const active =
              pathname === href || (href !== routes.home && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-2.5 py-2 text-sm font-medium transition ${
                  active
                    ? isHero
                      ? "bg-white/15 text-white"
                      : "bg-brand-soft text-brand"
                    : isHero
                      ? "text-white/70 hover:bg-white/10 hover:text-white"
                      : "text-ink-muted hover:bg-mist hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href={routes.home}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
            isHero
              ? "bg-brand-bright text-ink"
              : "bg-brand text-white hover:bg-brand-bright"
          }`}
        >
          Run audit
        </Link>
      </div>

      <nav
        className="mx-auto mt-3 flex max-w-6xl gap-1 overflow-x-auto pb-1 lg:hidden"
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
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
                active
                  ? isHero
                    ? "bg-white text-ink"
                    : "bg-brand text-white"
                  : isHero
                    ? "bg-white/10 text-white"
                    : "bg-mist text-ink-muted"
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
