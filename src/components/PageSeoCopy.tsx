type Props = {
  heading: string;
  paragraphs: string[];
};

/** Crawlable supporting copy for tool/utility pages (keeps interactive UIs thin-safe). */
export function PageSeoCopy({ heading, paragraphs }: Props) {
  return (
    <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
      <h2 className="font-display text-2xl font-semibold text-ink">{heading}</h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink-muted">
        {paragraphs.map((p) => (
          <p key={p.slice(0, 48)}>{p}</p>
        ))}
      </div>
    </section>
  );
}
