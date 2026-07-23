import { routes } from "@/lib/routes";

export type ToolSeoCopy = {
  heading: string;
  paragraphs: string[];
  faqs: { q: string; a: string }[];
  relatedHref?: string;
  relatedLabel?: string;
};

/** Crawlable body copy for free tool pages (server-rendered via SeoPageIntro). */
export const TOOL_SEO_COPY: Record<string, ToolSeoCopy> = {
  keywords: {
    heading: "How free keyword research works",
    paragraphs: [
      "Paste any public URL and SEOHub extracts phrases from titles, headings, and visible copy, then layers Google Suggest ideas so you can see what people type next. Optional DataForSEO volume appears when API keys are configured — without them, on-page and Suggest signals still work.",
      "Use this before rewriting a landing page or blog template: confirm the page already targets the phrases you care about, then open the rank checker or content optimizer to score fit. A full-site crawl later shows where the same keyword pattern repeats across templates.",
      "No account is required. Results stay in the session so you can iterate quickly, then jump into a free homepage audit when you are ready for Pass/Fail checks sitewide.",
    ],
    faqs: [
      {
        q: "Is this a full keyword database?",
        a: "No. It is an on-page + Suggest research helper. For always-on enterprise keyword graphs, use a research suite; for weekly page work, this tool is enough to start.",
      },
      {
        q: "Does it replace Google Search Console?",
        a: "No. Pair SEOHub phrases with Search Console queries when you have access. This tool helps when you need a fast public-URL read without logging into Google.",
      },
    ],
    relatedHref: routes.rankChecker,
    relatedLabel: "Check on-page rank signals",
  },
  "rank-checker": {
    heading: "On-page rank signals explained",
    paragraphs: [
      "Enter a URL and keyword to see whether the phrase appears in the title, H1, meta description, URL path, and body — plus a simple on-page score. When DataForSEO is configured, you may also see a live SERP position; otherwise you still get actionable placement flags.",
      "Rank checkers that only show a number hide why a page underperforms. SEOHub surfaces the placement gaps so you can fix the template once instead of guessing. Follow up with the content optimizer or a full-site scan if the issue looks template-wide.",
    ],
    faqs: [
      {
        q: "Why is SERP position missing?",
        a: "Live Google positions need DataForSEO credentials on the server. Without them, on-page placement checks still run so you can improve the page itself.",
      },
      {
        q: "Can I track keywords over time?",
        a: "Yes — save phrases in the on-device keyword tracker after a check. History stays in your browser; no account required.",
      },
    ],
    relatedHref: routes.contentOptimizer,
    relatedLabel: "Optimize content for the keyword",
  },
  content: {
    heading: "Content optimization without spam tactics",
    paragraphs: [
      "Score a page against a target keyword and get concrete recommendations: missing placements, thin sections, and density that looks unnatural. The goal is clearer pages for humans and crawlers — not stuffing.",
      "After you edit copy, re-run this tool, then preview titles in the meta SERP tool and confirm the rest of the template with a free homepage scan. Unlock a full crawl when you need the same checks across product or blog layouts.",
    ],
    faqs: [
      {
        q: "Will higher density always rank better?",
        a: "No. Over-optimized copy can read poorly and still fail. Aim for natural coverage of the topic, clear headings, and unique titles across the site.",
      },
    ],
    relatedHref: routes.metaPreview,
    relatedLabel: "Preview title & description",
  },
  "meta-preview": {
    heading: "SERP and social previews that stay honest",
    paragraphs: [
      "Edit title and description locally to see approximate Google and social card lengths before you ship CMS changes. Nothing leaves your browser until you choose to load a live URL into another tool.",
      "Truncation in search results varies by device and query. Use this preview as a guardrail: keep titles near 50–60 characters, descriptions near 150–160, and make the first clause carry the promise of the page.",
    ],
    faqs: [
      {
        q: "Does this fetch my live meta tags?",
        a: "The editor works offline by default. For live tags, inspect the page with a full SEOHub scan or your CMS preview.",
      },
    ],
    relatedHref: routes.keywords,
    relatedLabel: "Research keywords first",
  },
  robots: {
    heading: "Inspect robots.txt and sitemaps safely",
    paragraphs: [
      "Check whether robots.txt allows the paths you care about, whether a sitemap is advertised, and how many URLs are listed in the sample we fetch. Accidental Disallow rules and missing sitemaps are among the fastest ways to stall indexation.",
      "If the file is missing or wrong, generate a starter robots.txt or sitemap with the free generators, deploy them, then re-inspect. A full-site crawl still helps catch noindex and canonical problems that robots.txt cannot show.",
    ],
    faqs: [
      {
        q: "Can a disallow block Google forever?",
        a: "While Disallow is present, Googlebot should skip those paths. Remove or narrow the rule, then request indexing after the live file updates.",
      },
    ],
    relatedHref: routes.robotsGenerator,
    relatedLabel: "Generate a robots.txt starter",
  },
  headers: {
    heading: "Security headers that also show up in audits",
    paragraphs: [
      "Scan for HSTS, CSP, X-Frame-Options, Referrer-Policy, and related headers. Missing controls do not always mean an immediate SEO demotion, but they are trust and security signals SEOHub surfaces in Pass/Fail checks.",
      "After you deploy header changes at the CDN or origin, re-run this checker, then confirm the same hosts in a full audit. Pair with the redirects tool if HTTP→HTTPS hops are incomplete.",
    ],
    faqs: [
      {
        q: "Is a missing CSP always critical?",
        a: "Not always — CSP needs careful rollout. Still, HSTS and frame protections are high-value baselines for public marketing sites.",
      },
    ],
    relatedHref: `${routes.guides}/security-headers`,
    relatedLabel: "Read the security headers guide",
  },
  redirects: {
    heading: "Follow redirect chains before they waste crawl budget",
    paragraphs: [
      "Enter a URL to list each hop, status code, and Location target. Chains longer than a hop or two slow users and can dilute signals; loops break crawls entirely.",
      "Fix chains at the server or CDN so important URLs resolve in one step to HTTPS. Then verify with this tool and a sitewide crawl for soft 404s and mixed hosts.",
    ],
    faqs: [
      {
        q: "How many hops is too many?",
        a: "Prefer a single redirect to the final URL. More than two or three hops is a smell — especially on money pages.",
      },
    ],
    relatedHref: routes.brokenLinks,
    relatedLabel: "Check for broken outbound links",
  },
  schema: {
    heading: "Validate JSON-LD before Rich Results",
    paragraphs: [
      "Extract application/ld+json blocks, flag invalid JSON, and list declared types such as Organization, WebSite, FAQPage, or Product. Structured data will not magically rank a thin page, but broken JSON wastes an easy clarity win for Google and AI systems.",
      "After fixing schema in your layout, re-run this inspector and open Google’s Rich Results Test for final validation. SEOHub full audits also score AI visibility signals like Organization and FAQ presence.",
    ],
    faqs: [
      {
        q: "Do I need every schema type?",
        a: "No. Start with Organization and WebSite on the homepage, then add types that match real page content.",
      },
    ],
    relatedHref: `${routes.guides}/structured-data`,
    relatedLabel: "Structured data guide",
  },
  "broken-links": {
    heading: "Sample outbound links for 4xx and 5xx failures",
    paragraphs: [
      "We fetch the page and probe up to 40 outbound links — enough to catch obvious dead buttons, footer rot, and partner URLs without pretending to be a full-site crawl. Dead links hurt UX and waste crawl budget when they appear in navigation.",
      "For sitewide coverage, unlock a full SEOHub crawl after you fix the worst offenders. Export broken URLs from this tool’s list, patch them, and re-check.",
    ],
    faqs: [
      {
        q: "Why only 40 links?",
        a: "Sampling keeps the free tool fast and fair. Large sites should use the paid full crawl for broader coverage.",
      },
    ],
    relatedHref: `${routes.guides}/broken-links`,
    relatedLabel: "Broken links fix guide",
  },
  "sitemap-generator": {
    heading: "Generate a starter sitemap.xml",
    paragraphs: [
      "Build a simple XML sitemap from the URLs you paste, download it, and host it at /sitemap.xml (or the path you advertise in robots.txt). This is a starter — large sites should generate sitemaps from their CMS or build pipeline.",
      "After uploading, point robots.txt at the sitemap, then use the robots inspector to confirm discovery. A full SEOHub crawl still verifies which URLs are indexable beyond the sitemap list.",
    ],
    faqs: [
      {
        q: "Should every URL be in the sitemap?",
        a: "Include indexable URLs you care about. Omit thank-you pages, faceted duplicates, and anything marked noindex.",
      },
    ],
    relatedHref: routes.robotsInspector,
    relatedLabel: "Inspect robots & sitemap",
  },
  "robots-generator": {
    heading: "Draft a robots.txt without blocking CSS or JS",
    paragraphs: [
      "Generate a conservative robots.txt starter, review Disallow rules carefully, and download the file. Never block required assets or entire sections you still want indexed.",
      "Deploy to /robots.txt, verify with the inspector, and re-scan key templates. If AI crawlers matter for GEO, decide deliberately whether to allow GPTBot, ClaudeBot, and similar user-agents.",
    ],
    faqs: [
      {
        q: "Can this file hurt rankings?",
        a: "Yes — a broad Disallow can hide important sections. Treat generated files as drafts and review before production.",
      },
    ],
    relatedHref: routes.robotsInspector,
    relatedLabel: "Inspect the live robots.txt",
  },
  article: {
    heading: "Draft SEO articles without a subscription writer",
    paragraphs: [
      "Enter a target keyword (and optional site URL or notes) to generate a working title, meta description, outline, draft article, FAQs, JSON-LD ideas, and internal link suggestions. When DeepSeek is configured on the server you get a stronger draft; otherwise SEOHub still returns a solid template you can edit.",
      "Treat the output as a starting point for human editing — not publish-ready autopilot. Pair it with the keyword research and content optimizer tools so titles, density, and structure match what the page already ranks for, then validate schema with the JSON-LD checker before you ship.",
      "No account is required. Use this when you need a fast brief for a landing page or blog post, then run a free homepage scan to catch technical issues the draft cannot fix.",
    ],
    faqs: [
      {
        q: "Does this publish to my CMS?",
        a: "No. You copy the draft and paste it into your CMS. SEOHub does not store articles after the session ends.",
      },
      {
        q: "Will AI copy alone rank?",
        a: "Usually not. Unique facts, examples, and edits still matter. Use the draft to accelerate structure, then rewrite for your brand.",
      },
    ],
    relatedHref: routes.contentOptimizer,
    relatedLabel: "Score on-page content fit",
  },
  backlinks: {
    heading: "Backlink ideas without another monthly suite",
    paragraphs: [
      "Look up competitor link opportunities and review potentially risky referring domains when DataForSEO credentials are configured. The goal is a short outreach list — not a full backlink graph with historical metrics across millions of domains.",
      "Use competitor gaps to find relevant sites that already link in your niche, then check whether your own homepage and key templates are technically sound enough to earn those links. Pair outreach with a full-site crawl so thin pages and broken redirects do not waste the traffic you win.",
      "If API keys are missing, the tool explains what is unavailable instead of inventing data. Free to start, no login wall.",
    ],
    faqs: [
      {
        q: "Is this a replacement for Ahrefs or Semrush?",
        a: "No. Those suites go deeper on historical graphs and keyword databases. SEOHub focuses on weekly technical audits plus lightweight intel when keys are set.",
      },
      {
        q: "Why might results be empty?",
        a: "Backlink endpoints need DataForSEO configured on the server. Without credentials, use the free technical tools and homepage scan instead.",
      },
    ],
    relatedHref: routes.compareAhrefs,
    relatedLabel: "See SEOHub vs Ahrefs",
  },
  "js-render": {
    heading: "See what crawlers get without JavaScript",
    paragraphs: [
      "Compare the static HTML response with a JavaScript-rendered snapshot so you can spot content that only appears after client-side frameworks hydrate. Marketing sites on React, Vue, Framer, and similar stacks often look complete in a browser while bots see thin shells.",
      "If the rendered view adds critical copy, titles, or links the raw HTML lacks, fix SSR, prerendering, or meta generation at the template layer — not with more client widgets. Follow up with a free homepage scan and, when needed, a full-site crawl for template-wide gaps.",
      "No account required. Use this before blaming rankings on “content quality” when the real issue is what Googlebot received on first fetch.",
    ],
    faqs: [
      {
        q: "Does Google always execute JavaScript?",
        a: "Google can render JS, but it is slower and imperfect. Critical titles, body copy, and links should still appear in the initial HTML whenever possible.",
      },
      {
        q: "When should I worry?",
        a: "When important headings, product details, or nav links are missing from the static HTML but present after render — especially on money pages.",
      },
    ],
    relatedHref: routes.schema,
    relatedLabel: "Check JSON-LD on the live HTML",
  },
};
