import Link from "next/link";
import { mainNav } from "@/lib/routes";

export function RouteCards() {
  return (
    <section className="mt-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
          Scan once. Fix everywhere.
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          History, keywords, compare, and free tools — same product, no login wall.
        </p>
      </div>
      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {mainNav
          .filter((item) => item.href !== "/")
          .map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className="group border-t border-ink/10 pt-4 text-left transition hover:border-teal"
            >
              <span className="font-mono text-xs text-teal">0{i + 1}</span>
              <h3 className="font-display mt-2 text-lg font-semibold text-ink group-hover:text-teal">
                {item.label}
              </h3>
              <p className="mt-2 text-sm text-ink-muted">{item.description}</p>
            </Link>
          ))}
      </div>
    </section>
  );
}
