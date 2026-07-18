import HeadersToolClient from "./HeadersToolClient";
import { SeoPageIntro } from "@/components/SeoPageIntro";
import { pageMetadata } from "@/lib/page-seo";

export const metadata = pageMetadata({
  title: 'Security headers checker — SEOHub',
  description: 'Check HSTS, CSP, X-Frame-Options, Referrer-Policy, and other HTTP security headers that protect visitors and improve trust signals.',
  path: "/tools/headers",
});

export default function Page() {
  return (
    <>
      <HeadersToolClient />
      <SeoPageIntro heading='Security headers checker'>
        <p>Scan response headers for modern security controls. Missing HSTS, frame protection, or content-type sniffing defenses show up in SEOHub audits — use this free checker to verify fixes after you deploy header changes.</p>
      </SeoPageIntro>
    </>
  );
}
