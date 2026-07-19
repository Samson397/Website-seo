import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unlock success — SEOHub",
  robots: { index: false, follow: false },
};

export default function UnlockSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
