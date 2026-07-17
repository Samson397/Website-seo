import Link from "next/link";
import { mainNav } from "@/lib/routes";

export function RouteCards() {
  return (
    <section className="mt-14">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Explore</p>
        <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight text-ink">
          Scan once. Fix everywhere.
        </h2>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {mainNav
          .filter((item) => item.href !== "/")
          .map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className="group border-t border-ink/10 pt-4 transition hover:border-brand"
            >
              <span className="font-mono text-xs text-brand">0{i + 1}</span>
              <h3 className="font-display mt-2 text-lg font-semibold text-ink group-hover:text-brand">
                {item.label}
              </h3>
              <p className="mt-2 text-sm text-ink-muted">{item.description}</p>
            </Link>
          ))}
      </div>
    </section>
  );
}
