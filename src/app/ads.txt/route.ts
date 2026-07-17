import { ADSENSE_CLIENT } from "@/lib/adsense";

/**
 * Serve ads.txt explicitly so AdSense always gets text/plain at /ads.txt
 * (in addition to public/ads.txt).
 */
export function GET() {
  const publisher = ADSENSE_CLIENT.replace(/^ca-/, "");
  const body = `google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
