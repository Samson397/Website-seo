import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Website SEO Auditor",
    short_name: "SEO Auditor",
    description: "Free website SEO, security, and performance audit",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#2563eb",
  };
}
