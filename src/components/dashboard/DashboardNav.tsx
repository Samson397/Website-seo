"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { mainNav, routes } from "@/lib/routes";

export function DashboardNav() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-1 sm:gap-4">
          <Link href={routes.home} className="text-lg font-bold text-blue-600">
            SEOScan
          </Link>
          {mainNav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href === routes.dashboard && pathname.startsWith("/dashboard"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`hidden rounded-lg px-3 py-1.5 text-sm font-medium sm:inline ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden text-slate-500 sm:inline">{session?.user?.email}</span>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-slate-500 hover:text-slate-800"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
