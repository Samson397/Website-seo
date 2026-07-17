import Link from "next/link";
import { mainNav } from "@/lib/routes";

export function RouteCards() {
  return (
    <section className="mt-16">
      <div className="max-w-2xl">
        <p className="font-display text-sm font-semibold text-brand">Explore</p>
        <h2 className="font-display mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Scan once. Fix everywhere.
        </h2>
      </div>
      <div className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
        {mainNav
          .filter((item) => item.href !== "/")
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col gap-1 py-5 transition sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
            >
              <h3 className="font-display text-lg font-semibold tracking-tight text-ink transition group-hover:text-brand">
                {item.label}
              </h3>
              <p className="max-w-md text-sm text-ink-muted sm:text-right">{item.description}</p>
            </Link>
          ))}
      </div>
    </section>
  );
}
