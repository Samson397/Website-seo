import { pageMetadata } from "@/lib/page-seo";
import JsRenderToolClient from "./JsRenderToolClient";

export const metadata = pageMetadata({
  title: "JavaScript rendering check — SEOHub",
  description:
    "Compare static HTML with a JS-rendered snapshot to see what client-side frameworks hide from crawlers.",
  path: "/tools/js-render",
});

export default function JsRenderToolPage() {
  return <JsRenderToolClient />;
}
