import type { Metadata } from "next";

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  index?: boolean;
};

/** Unique title, description, self-canonical, and matching social tags. */
export function pageMeta({
  title,
  description,
  path,
  index = true,
}: PageMetaInput): Metadata {
  const canonical = path === "/" ? "/" : path;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "SEOHub",
      type: "website",
      locale: "en_GB",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}
