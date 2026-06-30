import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Website SEO Auditor",
  description:
    "Analyze any website for SEO issues, performance problems, accessibility errors, and security gaps.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
