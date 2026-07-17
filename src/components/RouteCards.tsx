import Link from "next/link";
import { mainNav } from "@/lib/routes";

export function RouteCards() {
  return (
    <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {mainNav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group border-t-2 border-teal/40 pt-4 transition hover:border-teal"
        >
          <h2 className="font-display text-lg font-semibold text-ink group-hover:text-teal">
            {item.label}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">{item.description}</p>
        </Link>
      ))}
    </section>
  );
}
