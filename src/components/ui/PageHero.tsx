import Image from "next/image";
import Link from "next/link";

interface PageHeroProps {
  /** Brand line — defaults to SEOHub. Prefer over uppercase eyebrows. */
  brand?: string;
  title: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  /** @deprecated Prefer `brand`. Ignored when `brand` is set. */
  eyebrow?: string;
}

/** Shared full-bleed hero — logo plate as the visual plane, brand-first copy. */
export function PageHero({
  brand = "SEOHub",
  title,
  description,
  children,
  actions,
}: PageHeroProps) {
  return (
    <section className="hero-mesh relative overflow-hidden px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-32">
      <div className="pointer-events-none absolute inset-0 select-none" aria-hidden>
        <Image
          src="/logo-hero.png"
          alt=""
          fill
          sizes="100vw"
          className="hero-mark object-cover object-[68%_42%] opacity-[0.55] sm:opacity-70"
          priority={false}
        />
      </div>
      <div className="relative z-[1] mx-auto max-w-6xl">
        <div className="max-w-xl">
          <p className="font-display animate-rise text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {brand}
          </p>
          <h1 className="font-display animate-rise-delay-1 mt-3 text-3xl font-bold tracking-tight text-ink sm:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="animate-rise-delay-2 mt-4 max-w-md text-base leading-relaxed text-ink-soft/90 sm:text-lg">
              {description}
            </p>
          )}
          {actions && (
            <div className="animate-rise-delay-2 mt-6 flex flex-wrap items-center gap-3">
              {actions}
            </div>
          )}
          {children && (
            <div className="animate-rise-delay-2 mt-6 w-full max-w-lg text-left">{children}</div>
          )}
        </div>
      </div>
    </section>
  );
}

export function PrimaryCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-soft"
    >
      {children}
    </Link>
  );
}

export function SecondaryCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex rounded-md border border-ink/20 bg-paper/70 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/35 hover:bg-paper"
    >
      {children}
    </Link>
  );
}
