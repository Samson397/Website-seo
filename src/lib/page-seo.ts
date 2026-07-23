import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "SEOHub — full-site SEO audits",
} as const;

/** Build per-route metadata with a self-canonical (never inherit `/`). */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  robots?: Metadata["robots"];
}): Metadata {
  const path = opts.path.startsWith("/") ? opts.path : `/${opts.path}`;
  const description =
    opts.description.length >= 120
      ? opts.description
      : `${opts.description} Free SEO tools from SEOHub — no account required.`;

  // Absolute self-canonical — homepage keeps a trailing slash to match the live URL.
  const site = getSiteUrl();
  const canonical =
    path === "/" ? `${site}/` : `${site}${path.endsWith("/") ? path.slice(0, -1) : path}`;

  return {
    title: opts.title,
    description,
    alternates: { canonical },
    ...(opts.robots ? { robots: opts.robots } : {}),
    openGraph: {
      title: opts.title,
      description,
      url: canonical,
      siteName: "SEOHub",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

export { OG_IMAGE };
