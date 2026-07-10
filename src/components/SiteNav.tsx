"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { mainNav, routes } from "@/lib/routes";
import { LogoMark } from "@/components/LogoMark";

interface SiteNavProps {
  variant?: "default" | "hero";
}

export function SiteNav({ variant = "default" }: SiteNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isHero = variant === "hero";

  return (
    <header
      className={
        isHero
          ? "absolute inset-x-0 top-0 z-20 px-4 pt-4 sm:px-6"
          : "border-b border-slate-200 bg-white"
      }
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <Link
          href={routes.home}
          className={`flex items-center gap-2 font-bold ${isHero ? "text-white" : "text-blue-600"}`}
        >
          <LogoMark size="sm" />
          <span>SEOScan</span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
          {mainNav.map((item) => {
            const href = item.href;
            const active = pathname === href || (href !== routes.home && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? isHero
                      ? "bg-white/20 text-white"
                      : "bg-blue-50 text-blue-700"
                    : isHero
                      ? "text-blue-100 hover:bg-white/10 hover:text-white"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {session ? (
            <Link
              href={routes.dashboard}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium sm:hidden ${
                isHero
                  ? "bg-white/15 text-white ring-1 ring-white/25"
                  : "bg-blue-600 text-white"
              }`}
            >
              My sites
            </Link>
          ) : (
            <>
              <Link
                href={routes.login}
                className={`hidden rounded-lg px-3 py-1.5 text-sm font-medium sm:inline ${
                  isHero ? "text-blue-100 hover:text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sign in
              </Link>
              <Link
                href={routes.register}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  isHero
                    ? "bg-white/15 text-white ring-1 ring-white/25"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile route tabs */}
      <nav
        className={`mx-auto mt-3 flex max-w-5xl gap-1 overflow-x-auto pb-1 sm:hidden ${isHero ? "" : "px-0"}`}
        aria-label="Main mobile"
      >
        {mainNav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                active
                  ? isHero
                    ? "bg-white text-blue-700"
                    : "bg-blue-600 text-white"
                  : isHero
                    ? "bg-white/15 text-white"
                    : "bg-slate-100 text-slate-700"
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
