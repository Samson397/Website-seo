import type { Metadata } from "next";

/** Build per-route metadata with a self-canonical (never inherit `/`). */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const path = opts.path.startsWith("/") ? opts.path : `/${opts.path}`;
  const description =
    opts.description.length >= 120
      ? opts.description
      : `${opts.description} Free SEO tools from SEOHub — no account required.`;

  return {
    title: opts.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: opts.title,
      description,
      url: path,
    },
    twitter: {
      title: opts.title,
      description,
    },
  };
}
