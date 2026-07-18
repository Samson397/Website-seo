import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — SEOHub",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mist text-ink">
      <div className="border-b border-ink/10 bg-paper px-4 py-3">
        <p className="font-display text-sm font-semibold tracking-tight">SEOHub admin</p>
        <p className="text-xs text-ink-muted">Not linked from the public site · robots noindex</p>
      </div>
      {children}
    </div>
  );
}
