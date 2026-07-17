import Link from "next/link";

interface PageHeroProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

/** Shared premium dark hero used across marketing and tool pages. */
export function PageHero({ eyebrow = "SEOHub", title, description, children, actions }: PageHeroProps) {
  return (
    <section className="hero-mesh relative overflow-hidden px-4 pb-14 pt-28 text-white sm:px-6 sm:pb-16 sm:pt-32">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        aria-hidden
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        <p className="animate-rise text-xs font-semibold uppercase tracking-[0.22em] text-teal-bright">
          {eyebrow}
        </p>
        <h1 className="font-display animate-rise-delay-1 mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="animate-rise-delay-2 mt-4 max-w-xl text-base text-white/75 sm:text-lg">
            {description}
          </p>
        )}
        {actions && <div className="animate-rise-delay-2 mt-6 flex flex-wrap gap-3">{actions}</div>}
        {children && <div className="animate-rise-delay-2 mt-8">{children}</div>}
      </div>
    </section>
  );
}

export function PrimaryCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex rounded-xl bg-teal-bright px-5 py-2.5 text-sm font-semibold text-ink shadow-glow transition hover:bg-teal"
    >
      {children}
    </Link>
  );
}

export function SecondaryCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
    >
      {children}
    </Link>
  );
}
