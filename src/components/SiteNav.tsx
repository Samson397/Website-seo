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
          ? "absolute inset-x-0 top-0 z-20 px-4 pt-6 sm:px-6"
          : "border-b border-ink/8 bg-white/80 backdrop-blur-md"
      }
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link
          href={routes.home}
          className={`flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight ${
            isHero ? "text-white" : "text-ink"
          }`}
        >
          <LogoMark size="sm" />
          <span>SEOHub</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
          {mainNav.map((item) => {
            const href = item.href;
            const active =
              pathname === href || (href !== routes.home && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`relative text-sm font-medium transition ${
                  active
                    ? isHero
                      ? "text-white"
                      : "text-ink"
                    : isHero
                      ? "text-white/55 hover:text-white"
                      : "text-ink-muted hover:text-ink"
                }`}
              >
                {item.label}
                {active ? (
                  <span
                    className={`absolute -bottom-1 left-0 h-px w-full ${
                      isHero ? "bg-brand-bright" : "bg-brand"
                    }`}
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <Link
          href={routes.home}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            isHero
              ? "bg-white text-ink hover:bg-brand-soft"
              : "bg-ink text-white hover:bg-ink-soft"
          }`}
        >
          Run audit
        </Link>
      </div>

      <nav
        className="mx-auto mt-4 flex max-w-6xl gap-4 overflow-x-auto pb-1 lg:hidden"
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
              className={`shrink-0 border-b-2 pb-1 text-xs font-medium transition ${
                active
                  ? isHero
                    ? "border-brand-bright text-white"
                    : "border-brand text-ink"
                  : isHero
                    ? "border-transparent text-white/50"
                    : "border-transparent text-ink-muted"
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
