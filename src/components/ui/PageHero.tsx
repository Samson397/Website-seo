import Link from "next/link";

interface PageHeroProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

/** Shared luminous hero — cool mist field so the navy/teal logo reads clearly. */
export function PageHero({
  eyebrow = "SEOHub",
  title,
  description,
  children,
  actions,
}: PageHeroProps) {
  return (
    <section className="hero-mesh relative overflow-hidden px-4 pb-14 pt-28 sm:px-6 sm:pb-16 sm:pt-32">
      <div className="relative mx-auto max-w-6xl">
        <p className="animate-rise text-xs font-semibold uppercase tracking-[0.22em] text-teal">
          {eyebrow}
        </p>
        <h1 className="font-display animate-rise-delay-1 mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="animate-rise-delay-2 mt-4 max-w-xl text-base text-ink-muted sm:text-lg">
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
      className="inline-flex rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-ink-soft"
    >
      {children}
    </Link>
  );
}

export function SecondaryCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex rounded-xl border border-ink/15 bg-white/70 px-5 py-2.5 text-sm font-semibold text-ink backdrop-blur transition hover:border-ink/25 hover:bg-white"
    >
      {children}
    </Link>
  );
}
