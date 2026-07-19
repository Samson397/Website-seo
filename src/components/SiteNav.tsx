"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { mainNav, routes } from "@/lib/routes";
import { LogoMark } from "@/components/LogoMark";

interface SiteNavProps {
  variant?: "default" | "hero";
}

export function SiteNav({ variant = "default" }: SiteNavProps) {
  const pathname = usePathname();
  const isHero = variant === "hero";
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <header
      className={
        isHero
          ? "absolute inset-x-0 top-0 z-20 px-4 pt-5 sm:px-6"
          : "border-b border-ink/10 bg-white/90 px-4 backdrop-blur-md sm:px-6"
      }
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-lg"
      >
        Skip to main content
      </a>
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
                    ? "bg-ink/8 text-ink"
                    : isHero
                      ? "text-ink/65 hover:bg-ink/5 hover:text-ink"
                      : "text-ink-muted hover:bg-mist hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl lg:hidden ${
            isHero
              ? "bg-white/60 text-ink ring-1 ring-ink/10"
              : "bg-mist text-ink"
          }`}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-drawer"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="sr-only">{menuOpen ? "Close" : "Menu"}</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            {menuOpen ? (
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M4 6h12M4 10h12M4 14h12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
            aria-label="Close menu overlay"
            onClick={() => setMenuOpen(false)}
          />
          <nav
            id="mobile-nav-drawer"
            className="absolute inset-x-4 top-[4.25rem] z-40 rounded-2xl border border-ink/10 bg-white p-3 shadow-lg lg:hidden"
            aria-label="Main mobile"
          >
            <ul className="space-y-1">
              {mainNav.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== routes.home && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block rounded-xl px-3 py-3 text-sm font-medium ${
                        active ? "bg-ink text-white" : "text-ink hover:bg-mist"
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="block">{item.label}</span>
                      <span
                        className={`mt-0.5 block text-xs font-normal ${
                          active ? "text-white/70" : "text-ink-muted"
                        }`}
                      >
                        {item.description}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      ) : null}
    </header>
  );
}
