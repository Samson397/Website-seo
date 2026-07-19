import Link from "next/link";
import { routes } from "@/lib/routes";

export type RelatedToolLink = {
  href: string;
  title: string;
  description?: string;
};

type Props = {
  tools: RelatedToolLink[];
  heading?: string;
  /** Show a link back to the full toolkit */
  showToolkitLink?: boolean;
};

/** Compact related-tools block for tool pages — border-top links, no cards. */
export function RelatedTools({
  tools,
  heading = "Related tools",
  showToolkitLink = true,
}: Props) {
  if (tools.length === 0) return null;

  return (
    <section className="mt-14 border-t border-ink/10 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-ink">{heading}</h2>
        {showToolkitLink ? (
          <Link href={routes.tools} className="text-sm text-teal hover:underline">
            All free tools
          </Link>
        ) : null}
      </div>
      <ul className="mt-6 grid gap-6 sm:grid-cols-2">
        {tools.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="group block border-t border-ink/10 pt-3 transition hover:border-brand"
            >
              <span className="font-display text-base font-semibold text-ink group-hover:text-brand">
                {tool.title}
              </span>
              {tool.description ? (
                <p className="mt-1 text-sm text-ink-muted">{tool.description}</p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
