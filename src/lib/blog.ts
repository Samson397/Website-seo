/**
 * SEO blog posts — add a new entry here, redeploy, and it appears on /blog + sitemap.
 * Keep slug unique (kebab-case). Prefer 800+ words of useful body copy for ranking.
 */
export type BlogPost = {
  slug: string;
  title: string;
  summary: string;
  /** ISO date YYYY-MM-DD */
  publishedAt: string;
  category: string;
  /** Optional keywords for internal linking / future tags */
  tags?: string[];
  body: string[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "full-site-seo-audit-checklist",
    title: "Full-site SEO audit checklist (what to fix first)",
    summary:
      "A practical order of operations for auditing an entire site — titles, indexation, links, and technical basics — without drowning in tools.",
    publishedAt: "2026-07-10",
    category: "SEO",
    tags: ["audit", "checklist", "technical-seo"],
    body: [
      "A homepage-only SEO check misses what search engines actually crawl: templates, category pages, thin blog posts, and broken paths buried in the footer. A full-site audit starts with coverage, then quality.",
      "First, confirm what is indexable. Check robots.txt, noindex tags, and canonicals on a sample of templates (home, product/service, blog, location). If Google cannot discover or is told not to index key URLs, on-page tweaks will not help.",
      "Second, fix unique titles and meta descriptions across the crawl — not just the homepage. Duplicate titles are one of the fastest wins on multi-page sites because they show up as patterns in a site-wide scan.",
      "Third, chase crawl waste: broken links (4xx/5xx), redirect chains, and soft 404s. These burn budget and frustrate users who arrive from bookmarks or internal nav.",
      "Fourth, ship a baseline of technical trust: HTTPS everywhere, sensible security headers, and valid structured data for Organization / WebSite on the home URL.",
      "Finally, re-scan after each batch of fixes. Rankings move slowly; your crawl report should move immediately. Use that feedback loop instead of guessing which ticket mattered.",
      "SEOHub’s free homepage preview shows scores and AI visibility quickly; unlock a full-site crawl when you need the checklist across up to 200 pages in one pass.",
    ],
  },
  {
    slug: "why-homepage-seo-is-not-enough",
    title: "Why a homepage SEO score is not enough",
    summary:
      "Homepages get the most attention — and hide template-level problems that decide whether the rest of your site can rank.",
    publishedAt: "2026-07-12",
    category: "SEO",
    tags: ["crawl", "templates", "indexation"],
    body: [
      "Founders often optimize the homepage until it looks perfect, then wonder why category or blog URLs never appear in Search Console. Search engines rank URLs, not brands — and most of your URL inventory is not the homepage.",
      "Template bugs multiply. A missing H1 on the blog layout, a self-canonical pointing at the wrong host, or a meta description that concatenates the same string on every post will fail hundreds of times for the price of one code mistake.",
      "Internal links are another homepage blind spot. If important pages are only reachable from JavaScript menus or PDF sitemaps, HTML crawlers (and many SEO tools) under-count them. A site crawl that follows real <a href> links surfaces that gap.",
      "Performance and security headers also vary by route. A fast homepage behind a CDN does not guarantee your app routes return the same Cache-Control, HSTS, or CSP behavior.",
      "Treat the homepage as a demo of quality, then prove the same standards on the templates that generate traffic. That is the difference between a vanity score and a ranking system.",
    ],
  },
  {
    slug: "ai-visibility-and-seo",
    title: "AI visibility: will assistants recommend your site?",
    summary:
      "Classic SEO still matters — but answer engines and AI assistants favor clear entities, structure, and trustworthy pages. Here is how to think about both.",
    publishedAt: "2026-07-14",
    category: "AI",
    tags: ["ai", "entities", "content"],
    body: [
      "Search is no longer only ten blue links. Assistants summarize brands, compare options, and cite sources. If your site is vague about who you are and what you offer, you are easy to skip in those answers.",
      "AI visibility overlaps with SEO fundamentals: a clear value proposition above the fold, organization schema, consistent NAP/brand naming, and pages that answer specific questions in plain language.",
      "Thin or boilerplate pages hurt twice — they rank poorly and give models little distinctive text to quote. Prefer concrete proof (pricing model, process, examples) over buzzwords.",
      "Technical access still matters. If key pages are blocked, client-rendered with empty HTML, or trapped behind login walls, neither Googlebot nor many AI fetchers will see your best copy.",
      "Use SEOHub’s AI visibility check on a free preview to see how an assistant-style read of your homepage might score you, then unlock a full crawl when you are ready to fix the site-wide patterns underneath.",
    ],
  },
  {
    slug: "pay-per-scan-vs-seo-subscription",
    title: "Pay-per-scan SEO vs another monthly subscription",
    summary:
      "When a one-time full-site audit is enough — and when a subscription tool is still worth the invoice.",
    publishedAt: "2026-07-16",
    category: "Product",
    tags: ["pricing", "workflow"],
    body: [
      "Most small sites do not need a forever SEO dashboard. They need a clear list of what is broken, a crawl that covers real pages, and a reason to fix things this week — not another login to ignore.",
      "Subscriptions shine when you monitor large catalogs daily, manage client portfolios, or need always-on rank tracking across thousands of keywords. That is real work for agencies and in-house SEO teams.",
      "For a founder shipping a marketing site or docs portal, a pay-per-scan model matches the job: audit before a launch, after a redesign, or when traffic dips. Pay when you crawl; skip the months you do not.",
      "Free homepage previews are useful for triage. Paid full-site unlocks are for the moment you commit to fixing titles, links, and headers across the property — exports, checklist, and shareable report included.",
      "If you outgrow occasional scans, keep the checklist habit and layer specialized tools later. Starting with a subscription you barely open is how SEO budgets die quietly.",
    ],
  },
  {
    slug: "how-to-fix-seo-issues-after-a-scan",
    title: "How to fix SEO issues after a site scan",
    summary:
      "Turn a wall of audit flags into a short sprint: prioritize by impact, fix templates first, then re-crawl to prove the win.",
    publishedAt: "2026-07-18",
    category: "Workflow",
    tags: ["fixes", "workflow", "prioritization"],
    body: [
      "An audit that nobody ships is worse than no audit — it creates false confidence. Start by grouping issues by template, not by individual URL, so one pull request can clear dozens of flags.",
      "Prioritize in this order: indexation blockers (noindex, canonical mistakes, robots), then unique titles/descriptions, then broken links and redirects, then structured data and security headers. Traffic cannot recover if the page is not eligible to rank.",
      "Assign owners. Content owns copy-level titles; engineering owns headers, redirects, and schema in the layout. Mixed ownership is why the same “missing meta description” ticket reappears for years.",
      "Re-scan after each merge. Compare the new report to the previous one so you can see pass counts move. That comparison is more motivating than a static PDF from last quarter.",
      "Keep a short “won’t fix” list for intentional choices (noindex on thank-you pages, thin legal stubs). Honesty in the backlog beats a 100% green score that lies.",
      "When you want the full checklist and crawl in one place, run SEOHub, unlock the site-wide pass, export the report, and work the list top-down until the re-scan is boring.",
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

/** Newest first */
export function listBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function formatBlogDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
