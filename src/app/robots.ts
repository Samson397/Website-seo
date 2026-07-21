import { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/admin", "/api/analytics", "/history", "/tracker", "/unlock"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
