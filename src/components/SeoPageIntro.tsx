/** Server-rendered intro copy so HTML crawlers see real page content. */
export function SeoPageIntro({
  heading,
  children,
}: {
  heading?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-3xl px-4 pb-2 pt-6 text-sm leading-relaxed text-ink-muted sm:px-6">
      {heading ? (
        <h2 className="font-display text-lg font-semibold text-ink">{heading}</h2>
      ) : null}
      <div className={heading ? "mt-2 space-y-3" : "space-y-3"}>{children}</div>
    </section>
  );
}
