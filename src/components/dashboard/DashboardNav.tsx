"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function DashboardNav() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-blue-600">
            SEOScan
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-blue-600">
            My sites
          </Link>
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
