import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SEOHub",
    short_name: "SEOHub",
    description: "Free website SEO, security, and performance scan",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#2563eb",
    icons: [
      { src: "/favicon-32.png?v=3", sizes: "32x32", type: "image/png" },
      { src: "/logo-icon.png?v=3", sizes: "256x256", type: "image/png", purpose: "any" },
      { src: "/apple-touch-icon.png?v=3", sizes: "180x180", type: "image/png" },
    ],
  };
}
