"use client";

import { usePathname } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Only overlay the dark hero mesh pages — nested tool pages use a light header.
  const useHeroNav =
    pathname === "/" ||
    pathname === "/history" ||
    pathname === "/competitors" ||
    pathname === "/tools" ||
    pathname === "/pricing" ||
    pathname === "/tracker" ||
    pathname === "/guides" ||
    pathname === "/about" ||
    pathname.startsWith("/unlock");

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <SiteNav variant={useHeroNav ? "hero" : "default"} />
      <div id="main-content">{children}</div>
      <SiteFooter />
    </>
  );
}
