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
    pathname === "/tools";

  return (
    <>
      <SiteNav variant={useHeroNav ? "hero" : "default"} />
      {children}
      <SiteFooter />
    </>
  );
}
