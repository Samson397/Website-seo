import Link from "next/link";
import { mainNav } from "@/lib/routes";

export function RouteCards() {
  return (
    <section className="section-rule mt-14 pt-12">
      <div className="max-w-2xl">
        <p className="font-display text-lg font-bold text-teal">Explore</p>
        <h2 className="font-display mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Scan once. Fix everywhere.
        </h2>
      </div>
      <ul className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
        {mainNav
          .filter((item) => item.href !== "/")
          .map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex flex-col gap-1 py-5 transition sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
              >
                <h3 className="font-display text-lg font-bold text-ink group-hover:text-teal">
                  {item.label}
                </h3>
                <p className="max-w-md text-sm text-ink-muted sm:text-right">{item.description}</p>
              </Link>
            </li>
          ))}
      </ul>
    </section>
  );
}
