/**
 * Seed SEO blog posts (shipped in code).
 * Prefer posting from /admin (Neon) so new articles go live without redeploy.
 * Keep slug unique (kebab-case). Prefer substantial body copy for ranking.
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
      "Prefer a printable starter list first? Use the free Technical SEO Checklist (/checklist/technical-seo) — Save as PDF in your browser, then run a scan when you want Pass/Fail results on your live site.",
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
  {
    slug: "core-web-vitals-seo-checklist",
    title: "Core Web Vitals for SEO: what to fix first",
    summary:
      "LCP, INP, and CLS decide whether a fast-looking demo survives real devices — here is a practical order of operations for marketing sites.",
    publishedAt: "2026-07-19",
    category: "Performance",
    tags: ["core-web-vitals", "lcp", "performance", "technical-seo"],
    body: [
      "Core Web Vitals are field-oriented UX metrics Google uses as ranking and experience signals: Largest Contentful Paint (LCP), Interaction to Next Paint (INP), and Cumulative Layout Shift (CLS). Lab scores in a quiet office are useful triage; Search Console field data is the score that matters.",
      "Start with LCP on your money templates — home, pricing, and top landing pages. Hero images without dimensions, render-blocking fonts, and slow origin TTFB are the usual culprits. Compress and size the LCP image, preload it when it is truly the hero, and avoid lazy-loading the element that should paint first.",
      "INP replaced FID as the interactivity vital. Long JavaScript tasks on first interaction (mega-menus, A/B snippets, chat widgets) hurt more than a pretty Lighthouse screenshot suggests. Defer non-critical scripts, break up hydration work, and measure on mid-tier mobile — not only on a desktop workstation.",
      "CLS is mostly preventable: reserve space for images, embeds, and ads; avoid inserting banners above existing content after load; use font-display strategies that do not shove text around. A one-line CSS fix often clears a “needs improvement” CLS band.",
      "Performance and SEO audits belong together. A page that passes titles and canonicals but ships a 4MB hero will still frustrate crawlers and users. Pair a [full-site SEOHub scan](/) with your RUM or CrUX view so technical SEO and vitals share one sprint board.",
      "Watch template variance. A CDN-cached homepage can look excellent while app routes or blog templates miss caching headers, ship heavier bundles, or load third-party tags differently. Spot-check those routes in the [HTTP headers tool](/tools/headers) and in the field data breakdown by URL group.",
      "Fix hosting and redirects before micro-optimizing images. Extra hops on http→https or www→apex delay every paint. Validate chains with the [redirect checker](/tools/redirects), then re-measure LCP.",
      "When you ship fixes, re-crawl with SEOHub to confirm security and SEO baselines did not regress (for example, a new tag manager breaking CSP). Vitals work that disables headers or breaks internal links is not a win.",
      "Prioritize by traffic × bad vital, not by vanity averages. One high-impression landing page in the “poor” LCP bucket beats polishing a legal page nobody visits.",
      "Keep a short vitals runbook: LCP image owner, script budget owner, and CLS review in design QA. Without owners, the same regressions return after the next marketing pixel is added.",
    ],
  },
  {
    slug: "schema-structured-data-basics",
    title: "Schema and structured data basics for marketing sites",
    summary:
      "Which JSON-LD types to ship first, how to keep them valid, and how SEOHub flags missing or broken structured data.",
    publishedAt: "2026-07-19",
    category: "SEO",
    tags: ["schema", "json-ld", "structured-data", "rich-results"],
    body: [
      "Structured data does not replace good copy — it labels the entities, products, and FAQs your HTML already contains so search engines and assistants can parse them reliably. JSON-LD in a script tag is the format most teams should standardize on.",
      "For a typical marketing site, ship Organization (or LocalBusiness) and WebSite on the homepage first, then BreadcrumbList on interior templates. That baseline covers brand entity grounding and navigational context before you chase niche rich results.",
      "SEOHub flags pages with no JSON-LD, malformed JSON, missing @context, and gaps such as Organization or FAQ types when those signals are expected. Invalid blocks are worse than sparse ones: a trailing comma can drop the entire graph.",
      "Validate early with the free [JSON-LD schema inspector](/tools/schema). Confirm the extracted blocks parse, then cross-check required properties against Google’s documentation for the types you claim.",
      "Keep schema honest. Marking a thin brochure page as Product or FAQPage when those elements are not visible is a policy risk and trains your team to ignore the checklist. Align types with on-page content reviewers can see.",
      "Prefer one coherent @graph over duplicate Organization nodes injected by a theme and a plugin. Conflicts and duplicates show up as noise in validators and in SEOHub’s deep schema checks.",
      "Article and BlogPosting help content templates: headline, datePublished, and a publisher Organization are the minimum useful set. Empty author fields and relative image URLs are common reasons eligibility fails later.",
      "After you deploy, [run a site scan](/) so schema checklist items clear across templates — not only on the URL you hand-tested. Client-only injection that never appears in the first HTML response is easy to miss in fetch-based audits.",
      "Local businesses should extend into LocalBusiness with consistent name, address, and telephone (NAP) matching the footer and Google Business Profile. Entity clarity helps classic local SEO and AI summaries alike.",
      "Treat schema like product code: review in PRs, snapshot examples in docs, and re-scan after CMS or theme upgrades. For step-by-step remediation, see the [structured data guide](/guides/structured-data).",
    ],
  },
  {
    slug: "local-seo-basics",
    title: "Local SEO basics: NAP, pages, and proof",
    summary:
      "A practical starter kit for multi-location and service-area businesses — without buying another directory package you will ignore.",
    publishedAt: "2026-07-20",
    category: "Local",
    tags: ["local-seo", "nap", "google-business", "citations"],
    body: [
      "Local SEO is the discipline of showing up for “near me” and city-qualified intent: maps packs, local finders, and organic results that expect a real business footprint. The foundation is consistent identity, useful location or service pages, and reviews — not ten thin city doorway URLs.",
      "Lock NAP consistency: the same name, address, and phone across your site footer, contact page, LocalBusiness schema, and Google Business Profile. Small mismatches (Suite vs Ste, tracking numbers that diverge) create avoidable entity confusion.",
      "Build one strong page per real location or distinct service area you can support with proof — photos, team, parking, hours, and unique copy. Duplicate boilerplate with a city name swapped still reads as spam to users and algorithms.",
      "Add LocalBusiness (or a more specific subtype) JSON-LD that matches the visible NAP. Validate with the [schema inspector](/tools/schema), then [scan the site](/) so SEOHub’s organization and structured-data checks reflect the live HTML.",
      "Earn and respond to reviews on the profiles that matter in your category. Asking happy customers beats buying citations on obscure directories you will never update again.",
      "Internal links should make locations discoverable from the homepage and contact flows with plain HTML anchors. If city pages only appear in a JavaScript widget, crawlers and many audits under-count them — a full SEOHub crawl following real links surfaces that gap.",
      "Technical hygiene still applies: unique titles and meta descriptions per location, self-referencing canonicals, and no accidental noindex on “Locations” templates. Use the [meta preview tool](/tools/meta-preview) before you ship a multi-city title pattern.",
      "Fix broken paths to stores and booking flows. A 404 on “Get directions” wastes paid and organic clicks; probe key templates with the [broken links tool](/tools/broken-links) and re-crawl after nav changes.",
      "Service-area businesses without a storefront should be honest in GBP and on-site copy about where they travel. Fake pin drops create trust problems that no title-tag tweak will repair.",
      "Re-audit quarterly: hours change, locations close, and seasonal landing pages rot. A pay-per-scan full-site pass is enough for most local operators — unlock when you need the checklist across every location URL in one report.",
    ],
  },
  {
    slug: "technical-seo-crawl-budget",
    title: "Technical SEO crawl budget: stop wasting Googlebot’s time",
    summary:
      "How soft 404s, redirect chains, faceted URLs, and thin duplicates burn crawl budget — and how to find them with a site-wide scan.",
    publishedAt: "2026-07-20",
    category: "Technical",
    tags: ["crawl-budget", "indexation", "redirects", "technical-seo"],
    body: [
      "Crawl budget is the attention search engines allocate to discovering and refreshing your URLs. Small sites rarely hit a hard ceiling; they still lose when bots waste fetches on junk while new or updated money pages wait.",
      "The usual budget drains: soft 404s (200 responses with “not found” content), long redirect chains, infinite faceted URL spaces, session parameters, and thin duplicates that all stay crawlable. Each wasted request is a request that did not hit a page you care about.",
      "Start with access control. Confirm robots.txt is not blocking important sections and that noindex is reserved for pages you truly want out of the index. Inspect rules with the [robots.txt tool](/tools/robots) before you rewrite canonical strategy.",
      "Collapse duplicates with canonicals and redirects. Prefer one HTTPS host, one slash policy, and 301s that finish in a single hop. Validate with the [redirect checker](/tools/redirects) — chains through legacy domains are a silent tax on every bot visit.",
      "Kill or parameter-handle faceted crawl paths you do not want indexed. If every color × size × sort combination is linked in HTML, you have built an infinite calendar for the crawler. Internal-link hygiene matters as much as robots rules.",
      "Fix broken links and error templates. 4xx/5xx targets and soft 404s show up in SEOHub’s crawl and checklist; the [broken links tool](/tools/broken-links) helps when you want a focused pass on nav and footer templates.",
      "Sitemaps should list canonical, indexable URLs only — not redirects, not noindexed thank-you pages, not staging leftovers. After regenerating, [run a full-site scan](/) to compare what your HTML links to versus what you intended to promote.",
      "Watch crawl stats in Search Console alongside your audit. Spikes in “discovered, not indexed” or endless parameter URLs usually trace back to a template or filter UI change, not a mysterious penalty.",
      "JavaScript-only navigation can hide important URLs from simple link graphs. Ensure critical paths exist as real <a href> links so both Googlebot and SEOHub’s crawler can discover them without executing every widget.",
      "Re-scan after information-architecture changes. Crawl budget issues are systemic; one merged PR that adds an unbounded filter can reopen hundreds of URLs. Use SEOHub’s site-wide report as the before/after proof for engineering, not only for SEO stakeholders.",
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
