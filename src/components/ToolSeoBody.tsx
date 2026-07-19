import Link from "next/link";
import { routes } from "@/lib/routes";
import type { ToolSeoCopy } from "@/lib/tool-seo-copy";

export function ToolSeoBody({ copy }: { copy: ToolSeoCopy }) {
  return (
    <div className="space-y-4 text-left text-sm leading-relaxed text-ink-muted">
      {copy.paragraphs.map((p) => (
        <p key={p.slice(0, 48)}>{p}</p>
      ))}
      <div className="space-y-3 border-t border-ink/10 pt-4">
        <h3 className="font-display text-base font-semibold text-ink">FAQ</h3>
        {copy.faqs.map((item) => (
          <div key={item.q}>
            <p className="font-semibold text-ink">{item.q}</p>
            <p className="mt-1">{item.a}</p>
          </div>
        ))}
      </div>
      {copy.relatedHref ? (
        <p>
          Next:{" "}
          <Link href={copy.relatedHref} className="font-medium text-teal hover:underline">
            {copy.relatedLabel || "Related tool"}
          </Link>
          {" · "}
          <Link href={routes.home} className="font-medium text-teal hover:underline">
            Run a free homepage scan
          </Link>
        </p>
      ) : null}
    </div>
  );
}
