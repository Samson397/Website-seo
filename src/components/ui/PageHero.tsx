import Link from "next/link";

interface PageHeroProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

/** Shared dark hero used across marketing and tool pages. */
export function PageHero({
  eyebrow = "SEOHub",
  title,
  description,
  children,
  actions,
}: PageHeroProps) {
  return (
    <section className="hero-mesh relative overflow-hidden px-4 pb-16 pt-28 text-white sm:px-6 sm:pb-20 sm:pt-32">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
          backgroundSize: "28px 28px",
          maskImage: "linear-gradient(180deg, black, transparent 85%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        <p className="animate-rise font-display text-sm font-semibold tracking-tight text-brand-bright">
          {eyebrow}
        </p>
        <h1 className="font-display animate-rise-delay-1 mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="animate-rise-delay-2 mt-4 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
            {description}
          </p>
        )}
        {actions && <div className="animate-rise-delay-2 mt-7 flex flex-wrap gap-3">{actions}</div>}
        {children && <div className="animate-rise-delay-2 mt-8">{children}</div>}
      </div>
    </section>
  );
}

export function PrimaryCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-brand-soft"
    >
      {children}
    </Link>
  );
}

export function SecondaryCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
    >
      {children}
    </Link>
  );
}
