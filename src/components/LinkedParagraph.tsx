import Link from "next/link";
import type { ReactNode } from "react";

const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

/** Render a paragraph with optional `[label](/path)` markdown links. */
export function LinkedParagraph({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const parts: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(LINK_RE.source, "g");
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const label = match[1];
    const href = match[2];
    if (href.startsWith("/")) {
      parts.push(
        <Link key={`${match.index}-${href}`} href={href} className="font-medium text-teal hover:underline">
          {label}
        </Link>
      );
    } else {
      parts.push(
        <a
          key={`${match.index}-${href}`}
          href={href}
          className="font-medium text-teal hover:underline"
          rel="noopener noreferrer"
        >
          {label}
        </a>
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <p className={className}>{parts.length > 0 ? parts : text}</p>;
}

/** Plain text for JSON-LD / metadata — drops markdown link syntax, keeps labels. */
export function stripMarkdownLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
}
