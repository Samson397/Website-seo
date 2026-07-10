import Link from "next/link";
import { routes } from "@/lib/routes";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
      <nav className="flex justify-center gap-5">
        <Link href={routes.about} className="hover:text-blue-600">
          About
        </Link>
        <Link href={routes.privacy} className="hover:text-blue-600">
          Privacy
        </Link>
        <Link href={routes.terms} className="hover:text-blue-600">
          Terms
        </Link>
      </nav>
    </footer>
  );
}
