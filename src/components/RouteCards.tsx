import Link from "next/link";
import { mainNav } from "@/lib/routes";

export function RouteCards() {
  return (
    <section className="mt-8 grid gap-4 sm:grid-cols-3">
      {mainNav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
        >
          <h2 className="font-semibold text-slate-900">{item.label}</h2>
          <p className="mt-1 text-sm text-slate-600">{item.description}</p>
          <p className="mt-3 text-xs font-mono text-blue-600">{item.href}</p>
        </Link>
      ))}
    </section>
  );
}
