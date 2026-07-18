import { pageMeta } from "@/lib/page-meta";
import { PAGE_SEO } from "@/lib/page-seo";
import { PageSeoCopy } from "@/components/PageSeoCopy";

const seo = PAGE_SEO.headers;
export const metadata = pageMeta(seo);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PageSeoCopy heading={seo.heading} paragraphs={[...seo.paragraphs]} />
    </>
  );
}
