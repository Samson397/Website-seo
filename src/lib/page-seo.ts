/** Per-page SEO copy: unique titles/descriptions plus crawlable body paragraphs. */

export type PageSeo = {
  title: string;
  description: string;
  path: string;
  /** Visible H2 for the SEO copy block */
  heading: string;
  paragraphs: string[];
};

export const HOME_SEO = {
  title: "SEOHub — Free full-site SEO audit you run every week",
  description:
    "Run a free full-site SEO audit with 50+ checks, crawl coverage, keyword tools, and a private watchlist on your device. No account required — start in seconds.",
  path: "/",
  heading: "What you get from a SEOHub weekly audit",
  paragraphs: [
    "SEOHub is a browser-first SEO audit built for the check you actually run every week: crawl public pages, score SEO, speed signals, accessibility, security, and AI visibility, then show fixes in plain language.",
    "Start free with a homepage preview, unlock a full crawl when you need depth, and keep history plus a watchlist on this device. Free tools for keywords, redirects, schema, and generators stay available without a login wall.",
    "Use the sample report to see the output before you scan, compare competitors side by side, and follow short fix guides when checklist items fail. No multi-seat SaaS required for a clear technical baseline.",
  ],
} as const;

export const PAGE_SEO = {
  history: {
    title: "Scan history & watchlist — SEOHub",
    description:
      "Review recent SEOHub audits and keep a private watchlist in this browser. Re-scan sites weekly without creating an account or syncing to the cloud.",
    path: "/history",
    heading: "How scan history works on SEOHub",
    paragraphs: [
      "Every full or preview audit you run can be saved on this device so you can compare scores week over week. History stays in your browser’s local storage — clear site data and it disappears, which keeps the product simple and private.",
      "Add important domains to your watchlist when you want a nudge to re-check. SEOHub tracks when you last scanned and highlights sites that are due for another pass, so technical SEO does not slip between launches.",
      "Use history alongside the free toolkit: open a past URL, jump back to the homepage scanner, or pair watchlist items with keyword tracking. No login wall stands between you and a consistent weekly site check.",
    ],
  },
  tracker: {
    title: "Keyword tracker — SEOHub",
    description:
      "Track target keywords and on-page rank signals on this device. Re-check title, H1, meta, and optional SERP position anytime — free, no account.",
    path: "/tracker",
    heading: "Track keywords without another SaaS login",
    paragraphs: [
      "The keyword tracker stores phrases and URLs in this browser so you can monitor on-page presence for title tags, meta descriptions, H1s, and URL slugs. Re-run a check whenever you publish or refresh content.",
      "When DataForSEO credentials are configured on the server, checks can also surface Google SERP position estimates. Otherwise you still get a clear on-page score that shows whether the page is optimized for the phrase you care about.",
      "Pair the tracker with SEOHub’s keyword research and rank checker tools, then confirm site-wide issues with a full crawl. Everything is built for founders and marketers who want signal without a subscription stack.",
    ],
  },
  tools: {
    title: "Free SEO tools toolkit — SEOHub",
    description:
      "Browse free SEO tools for keywords, meta previews, redirects, schema, broken links, security headers, sitemaps, and robots.txt — no account required.",
    path: "/tools",
    heading: "A practical toolkit next to your weekly audit",
    paragraphs: [
      "SEOHub’s tools cover the jobs that sit beside a full-site crawl: research keywords, preview SERP snippets, inspect robots and sitemaps, validate JSON-LD, follow redirect chains, and generate starter technical files.",
      "Each tool fetches public pages only and returns actionable output you can fix the same day. Use them while drafting content, shipping a redesign, or clearing issues from your latest SEOHub report.",
      "Start with the homepage scanner for coverage across SEO, performance, accessibility, security, and AI visibility — then deep-dive with the specialist checkers linked below.",
    ],
  },
  metaPreview: {
    title: "Meta & SERP preview tool — SEOHub",
    description:
      "Preview Google-style title and meta description snippets before you publish. Tune length, clarity, and click appeal — free SERP preview, no login.",
    path: "/tools/meta-preview",
    heading: "Why preview titles and descriptions",
    paragraphs: [
      "Search snippets are often the first impression of your page. A unique title around 50–60 characters and a meta description around 120–160 characters help the right query match a clear promise.",
      "This SERP preview lets you edit copy live and see how truncation and layout might look in results and social cards. Use it before CMS changes so you ship confident metadata.",
      "After publishing, re-scan the URL with SEOHub to confirm the crawl picks up your new title and description across templates — and that duplicates are not still competing site-wide.",
    ],
  },
  robots: {
    title: "robots.txt & sitemap inspector — SEOHub",
    description:
      "Inspect robots.txt rules and sitemap coverage for any public site. See disallow-all mistakes, sitemap URL counts, and sample URLs instantly.",
    path: "/tools/robots",
    heading: "Catch crawl blocks before they cost rankings",
    paragraphs: [
      "A misconfigured robots.txt can hide an entire site from Googlebot. This inspector fetches robots rules and sitemap data so you can verify crawlers are allowed and that your sitemap lists the URLs you expect.",
      "Look for Disallow: / on production, missing sitemap directives, and thin or empty sitemaps after migrations. Fix those before you invest in content or link building.",
      "When you need starter files, use SEOHub’s sitemap and robots generators, then confirm the live versions with this inspector.",
    ],
  },
  headers: {
    title: "Security headers checker — SEOHub",
    description:
      "Check HSTS, CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy, and related browser security headers on any HTTPS URL. Free and instant.",
    path: "/tools/headers",
    heading: "Security headers that build trust",
    paragraphs: [
      "Modern browsers use response headers to reduce clickjacking, mixed content, and script injection risk. SEOHub’s checker shows which headers are present and which are missing on a live URL.",
      "Prioritize HTTPS with HSTS, a workable Content-Security-Policy, frame protections, nosniff, and a sensible Referrer-Policy. Add Permissions-Policy to disable unused device APIs.",
      "Header hygiene also appears in SEOHub full-site audits, so you can track improvements alongside SEO and accessibility fixes.",
    ],
  },
  redirects: {
    title: "Redirect chain checker — SEOHub",
    description:
      "Follow every redirect hop to the final URL. Spot loops, mixed HTTP/HTTPS, long chains, and soft failures that waste crawl budget.",
    path: "/tools/redirects",
    heading: "Keep redirect chains short and clean",
    paragraphs: [
      "Long redirect chains slow users and confuse crawlers. This tool follows hops and reports status codes so you can collapse chains into a single 301 to the canonical HTTPS destination.",
      "Watch for HTTP to HTTPS to www bounces, temporary redirects left over from campaigns, and loops that never settle. Fix those URLs in sitemaps and internal links too.",
      "Combine redirect checks with SEOHub’s site crawl to see redirect patterns across templates, not just one URL at a time.",
    ],
  },
  schema: {
    title: "JSON-LD schema inspector — SEOHub",
    description:
      "Extract and validate JSON-LD structured data. See Organization, WebSite, FAQ, Article, and Breadcrumb types declared on any public page.",
    path: "/tools/schema",
    heading: "Structured data for search and AI assistants",
    paragraphs: [
      "JSON-LD helps search engines and AI systems understand your brand, pages, and FAQs. This inspector extracts script blocks, checks JSON validity, and highlights common schema types.",
      "Most marketing sites should ship Organization and WebSite on the homepage, BreadcrumbList on inner pages, and FAQPage where you answer real questions. Invalid JSON silently drops the whole block.",
      "After you add markup, re-run this tool and your SEOHub audit to confirm entity signals improve AI visibility scores.",
    ],
  },
  brokenLinks: {
    title: "Broken link checker — SEOHub",
    description:
      "Scan a page’s outbound links for 4xx and 5xx failures. Find dead URLs that waste crawl budget and frustrate visitors — free broken link tool.",
    path: "/tools/broken-links",
    heading: "Fix broken links before users bounce",
    paragraphs: [
      "Dead links in navigation, footers, and blog posts send people to error pages and burn crawl budget. This checker fetches a page and probes outbound URLs for failure statuses.",
      "Update hrefs to live equivalents when possible. For retired content, 301 to the best replacement instead of leaving soft 404s that look fine to humans but fail for bots.",
      "Run the checker on key templates after migrations, then use SEOHub’s full crawl to catch site-wide patterns.",
    ],
  },
  keywords: {
    title: "Keyword research tool — SEOHub",
    description:
      "Extract on-page keyword phrases and Google autocomplete suggestions from any URL. Optional search volume when DataForSEO is configured.",
    path: "/tools/keywords",
    heading: "Keyword ideas grounded in real pages",
    paragraphs: [
      "Start from a competitor or your own URL to see phrases already used in titles, headings, and body copy, plus Google suggestion seeds you can expand into content briefs.",
      "When server-side DataForSEO keys are available, volume and difficulty enrich the list. Without them, on-page extraction and autocomplete still give a fast research pass for free.",
      "Save promising phrases in the keyword tracker and verify optimization with the rank checker and content optimizer.",
    ],
  },
  rankChecker: {
    title: "Rank checker — SEOHub",
    description:
      "Score how well a page targets a keyword in title, H1, meta, and URL. Optional Google position via DataForSEO when configured — free rank check.",
    path: "/tools/rank-checker",
    heading: "On-page rank signals you can fix today",
    paragraphs: [
      "Before you chase backlinks, confirm the page actually targets the keyword in the places crawlers weight heavily: title, H1, meta description, and URL path.",
      "SEOHub scores those on-page signals instantly. With DataForSEO configured, you can also pull an estimated SERP position for deeper competitive work.",
      "Re-check after content edits and keep a history of important phrases in the on-device keyword tracker.",
    ],
  },
  content: {
    title: "Content optimizer — SEOHub",
    description:
      "Score page copy against a target keyword. Get word count, density, placement checks, and clear recommendations to improve on-page SEO.",
    path: "/tools/content",
    heading: "Optimize content with concrete fixes",
    paragraphs: [
      "The content optimizer evaluates a live URL against a target keyword and returns practical recommendations — not a vanity score with no next step.",
      "You will see whether the phrase appears in title, meta, and H1, plus word count and density context so you can deepen thin pages or trim awkward stuffing.",
      "Use it after drafting blog posts or landing pages, then confirm the wider site still looks healthy with a SEOHub crawl.",
    ],
  },
  sitemapGenerator: {
    title: "XML sitemap generator — SEOHub",
    description:
      "Paste a URL list and download a valid sitemap.xml for your site root. Free sitemap generator with no account or watermark.",
    path: "/tools/sitemap-generator",
    heading: "Build a clean sitemap.xml quickly",
    paragraphs: [
      "Sitemaps help crawlers discover indexable URLs after launches and migrations. Paste the pages you want indexed, set a base URL, and download a standards-friendly XML file.",
      "Keep sitemaps limited to canonical, indexable URLs — skip admin paths, thank-you pages, and faceted duplicates. Submit the file in Search Console and reference it from robots.txt.",
      "Validate the live sitemap afterward with SEOHub’s robots and sitemap inspector.",
    ],
  },
  robotsGenerator: {
    title: "robots.txt generator — SEOHub",
    description:
      "Create a starter robots.txt with allow rules, disallow paths, and a sitemap directive. Download and deploy to your site root.",
    path: "/tools/robots-generator",
    heading: "Ship a safe starter robots.txt",
    paragraphs: [
      "A clear robots.txt tells crawlers what they may fetch and where your sitemap lives. Generate a starter file with allow-all or custom disallow paths for admin and staging areas.",
      "Never disallow important marketing URLs by accident. After upload, fetch the live file with the robots inspector and run a site audit to confirm pages remain indexable.",
      "Pair robots rules with self-referencing canonicals and a accurate sitemap for a solid technical baseline.",
    ],
  },
} as const satisfies Record<string, PageSeo>;
