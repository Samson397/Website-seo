/** Server-rendered intro copy so HTML crawlers see real page content. */
export function SeoPageIntro({
  heading,
  children,
}: {
  heading?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="section-rule mx-auto max-w-2xl px-0 pb-2 pt-12 text-left text-sm leading-relaxed text-ink-muted">
      {heading ? (
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">{heading}</h2>
      ) : null}
      <div className={heading ? "mt-4 space-y-3" : "space-y-3"}>{children}</div>
    </section>
  );
}
