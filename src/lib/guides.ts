import { routes } from "@/lib/routes";

export type Guide = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  /** Checklist / issue ids this guide helps with */
  relatedCheckIds?: string[];
  body: string[];
};

export const GUIDES: Guide[] = [
  {
    slug: "title-tags",
    title: "Write title tags that rank and click",
    summary: "Aim for unique 50–60 character titles that name the page and the brand.",
    category: "SEO",
    relatedCheckIds: ["title", "title-length", "duplicate-title"],
    body: [
      "Every indexable page needs one unique <title>. Duplicate titles dilute rankings and confuse SERPs — searchers cannot tell your product page from your blog post when both say the same thing.",
      "SEOHub flags missing titles, titles that are too short or too long, and duplicate titles across a full-site crawl. On a homepage preview you will see the title check immediately; unlock a site-wide scan to catch template-level duplicates on dozens of URLs at once.",
      "Put the primary keyword near the front, keep the brand at the end, and stay under ~60 characters so Google doesn’t truncate the snippet. Front-loading the topic helps both rankings and click clarity.",
      "Write for the click, not just the keyword. A title like “Pricing — SEOHub” beats “Best affordable SEO audit software solution 2026” when the page is actually your pricing page.",
      "Fix templates first. If your CMS injects the same site name into every post title without the article name, one layout change clears hundreds of duplicate-title flags in the next crawl.",
      `Use the free [meta preview tool](${routes.metaPreview}) to see how a candidate title and description look in a SERP-style snippet before you ship.`,
      `After you change titles, [re-scan your site](${routes.home}) so SEOHub’s crawl picks up the new values across templates — rankings move slowly, but the checklist should move right away.`,
      `Compare related URLs in a [competitor scan](${routes.competitors}) when you are unsure how rivals phrase the same intent. Steal clarity, not fluff.`,
      "Keep a short style guide: character range, brand placement, and whether category pages include a modifier (year, city, product line). Consistency is what keeps new pages from reintroducing the same fails.",
      "When SEOHub still shows “title length” attention after a fix, check for whitespace, pipe characters, and auto-appended brand strings that push you past 60 characters in the rendered HTML.",
      "Pair title work with on-page H1 alignment. The title and H1 do not need to match word-for-word, but they should describe the same page so users and crawlers get one clear topic.",
      "Export the report when you are done and mark title issues closed only after a clean re-scan — that closes the loop between checklist and production.",
    ],
  },
  {
    slug: "meta-descriptions",
    title: "Meta descriptions that earn the click",
    summary: "Descriptions don’t rank directly — they win the SERP click.",
    category: "SEO",
    relatedCheckIds: ["meta-description", "duplicate-description"],
    body: [
      "Write a unique meta description for each important page. Target roughly 120–160 characters so the full sentence fits typical desktop SERP widths without awkward truncation.",
      "SEOHub flags missing descriptions, weak or short copy, length outliers, and duplicate descriptions across crawled pages. Site-wide duplicates usually mean a template is concatenating the same boilerplate on every URL.",
      "Lead with the benefit, include a soft call to action, and avoid stuffing keywords. The description is an ad for the click — clarity beats density.",
      "Match the promise to the visible intro. If Google rewrites your snippet, your on-page opening may not support the meta you wrote; tighten the first paragraph so the description and content agree.",
      `Preview candidates in the [meta preview tool](${routes.metaPreview}) alongside the title so you can judge the full SERP block, not each field in isolation.`,
      "Prioritize money pages and high-impression URLs first: home, pricing, key services, and top blog posts. Thin legal stubs can wait.",
      "For blogs and docs, summarize the specific answer the page gives. Generic lines like “Read our latest insights” waste the only free advertising space you control on the SERP.",
      `After publishing, [run a scan](${routes.home}) and confirm duplicate-description and missing-description flags clear on the templates you fixed.`,
      "If you manage many locales, keep descriptions in the page language and avoid copying English CTAs onto translated URLs — that pattern shows up as near-duplicates in crawls.",
      `Use the [content optimizer](${routes.contentOptimizer}) when the page itself is thin; a great meta cannot save a page that has nothing distinctive to say.`,
      "Document who owns descriptions (content vs. engineering). Mixed ownership is why the same “missing meta description” ticket reappears after every redesign.",
      "Re-check after CMS upgrades — some platforms overwrite custom meta on theme changes. A quick SEOHub crawl after deploy catches that before Search Console does.",
    ],
  },
  {
    slug: "canonical-tags",
    title: "Canonical tags that prevent duplicates",
    summary: "Tell search engines which URL is the preferred version of a page.",
    category: "Technical",
    relatedCheckIds: ["canonical"],
    body: [
      "Add a self-referencing rel=canonical on every indexable page pointing at the preferred HTTPS URL. That tells crawlers which version to consolidate when parameters, mirrors, or slash variants exist.",
      "SEOHub reports missing canonicals, invalid canonical URLs, multiple canonical tags on one page, and site-wide coverage gaps when many crawled pages omit the tag. Cross-domain canonicals that point off your host are called out separately.",
      "Use canonicals for query-param and trailing-slash variants — don’t noindex pages you still want indexed. Canonicals consolidate; noindex removes.",
      "Prefer absolute https:// URLs in the href. Relative or http:// canonicals are a common source of “invalid canonical” flags after a protocol migration.",
      "One tag only. Multiple conflicting canonicals confuse parsers and often appear when a theme and a plugin both inject link tags.",
      `Audit redirect behavior with the [redirect checker](${routes.redirects}) so the preferred URL actually resolves in one hop — a canonical that 404s or chains through three redirects wastes the signal.`,
      `Confirm robots rules with the [robots.txt inspector](${routes.robotsInspector}) before you rely on canonicals alone. A Disallow that blocks the preferred URL cannot be fixed by a tag on a crawlable duplicate.`,
      `After fixing, [crawl again](${routes.home}) and confirm “No canonical” / coverage flags disappear in the site map and checklist panels.`,
      "For pagination, faceted nav, and print views, decide a policy: self-canonical each useful view, or point filters back to a clean category URL. Document the choice so new templates do not invent a third rule.",
      "Watch www vs non-www and trailing-slash hosts. Pick one hostname, 301 the rest, and make canonicals match the live preferred host.",
      "When comparing competitors, note whether they canonicalize category filters — inconsistent handling of facets is a frequent crawl-budget leak on large catalogs.",
      "Ship canonicals in the HTML head of the first response when possible. Client-only injection is slower for crawlers and easier to miss in static audits.",
    ],
  },
  {
    slug: "security-headers",
    title: "Ship the security headers that matter",
    summary: "HSTS, CSP, and frame protections protect users and boost trust signals.",
    category: "Security",
    relatedCheckIds: ["hsts", "csp", "x-frame-options"],
    body: [
      "Security headers are response headers that browsers enforce: they reduce clickjacking, mixed content, and protocol downgrade risk. They also show up as trust and technical checks in modern site audits.",
      "SEOHub flags missing HSTS, weak or absent Content-Security-Policy, missing X-Frame-Options (or frame-ancestors), and related baseline headers during homepage and full-site scans. Failures often vary by route when a CDN and an origin app disagree.",
      "Enable HSTS only once HTTPS is solid across the whole host. When ready, add includeSubDomains — and understand that pinning browsers to HTTPS is hard to undo, so test staging first.",
      "Start CSP in report-only, then tighten script-src and object-src until you can enforce. A sudden enforce mode with 'unsafe-inline' removed can break analytics and widgets overnight.",
      "Set X-Frame-Options or CSP frame-ancestors, Referrer-Policy, and Permissions-Policy as a baseline even if you are not chasing a perfect A+ score on every scanner.",
      `Inspect live responses with the free [HTTP headers tool](${routes.headers}) on key templates: home, app routes, and static asset hosts if they are separate.`,
      `After CDN or host changes, [re-scan](${routes.home}) — SEOHub will show whether HSTS and CSP still appear on the URLs that matter, not just on a single marketing homepage cached elsewhere.`,
      `Align headers with redirects. If http:// still serves content without redirecting, HSTS on https:// alone leaves a gap; fix the [redirect chain](${routes.redirects}) first.`,
      "Document exceptions (payment iframes, third-party embeds) in the CSP so future engineers do not “fix” security by deleting the policy.",
      "Treat report-uri / report-to noise as a backlog, not a reason to disable CSP. Tighten gradually using real violation reports.",
      "Marketing sites and app shells may need different policies. Prefer shared defaults at the edge with path overrides over copy-pasted nginx snippets that drift.",
      "When the checklist is green, keep a quarterly headers check in your deploy notes — theme and plugin updates are a common way CSP quietly disappears.",
    ],
  },
  {
    slug: "broken-links",
    title: "Find and fix broken links",
    summary: "4xx/5xx links waste crawl budget and frustrate visitors.",
    category: "Links",
    relatedCheckIds: ["broken-link"],
    body: [
      "Broken internal and external links return 4xx or 5xx responses. They waste crawl budget, create dead ends for users, and signal neglect on otherwise strong pages.",
      `SEOHub’s site crawl and checklist surface broken-link issues from followed <a href> targets. The dedicated [broken links tool](${routes.brokenLinks}) is ideal when you want to probe a single URL or template quickly without a full unlock.`,
      "Start with key templates: home, primary nav, footer, pricing, and high-traffic blog posts. Footer and sidebar “resource” lists are frequent sources of rotting outbound URLs.",
      "Prefer updating the href to a live equivalent over deleting useful navigation. Removing a link can orphan a page that still deserves internal equity.",
      "For retired URLs, 301 to the best replacement — don’t leave soft 404s that return 200 with “page not found” copy. Soft 404s confuse both users and crawlers.",
      `Check redirect quality with the [redirect checker](${routes.redirects}) so fixes land in one hop on HTTPS rather than chains through old domains.`,
      `After cleanup, [run a full-site scan](${routes.home}) to confirm broken-link counts drop and no new 404s were introduced by a nav redesign.`,
      "Automate prevention: add link checking to staging, and avoid hand-maintained URL lists in CMSs when a structured menu can stay in sync with published slugs.",
      "Outbound affiliate and partner links die often. Schedule a quarterly pass on money pages; SEOHub and the broken-links tool make that pass measurable.",
      "Distinguish crawlable HTML links from links only present in JavaScript widgets. SEOHub follows real anchors — if critical paths are JS-only, fix discoverability as well as status codes.",
      "When a CMS renames a slug, search the codebase and content DB for the old path; one missed hardcoded URL recreates the same fail on the next crawl.",
      "Keep a short log of intentional 410s vs 301s so the team does not “restore” a URL that was deliberately retired.",
    ],
  },
  {
    slug: "structured-data",
    title: "Add JSON-LD that Google understands",
    summary: "Organization, WebSite, and BreadcrumbList cover most marketing sites.",
    category: "SEO",
    relatedCheckIds: ["schema", "json-ld"],
    body: [
      "Structured data (usually JSON-LD) helps search engines and AI systems understand entities, products, FAQs, and breadcrumbs — not by stuffing keywords, but by labeling what the page already says.",
      "SEOHub flags missing structured data, invalid or unparsable JSON-LD, and gaps like missing Organization / LocalBusiness or FAQ schema when those types are expected. Deep checks catch bare arrays and missing @context that break parsers.",
      "Start with Organization + WebSite on the homepage, then BreadcrumbList on inner pages. That trio covers most marketing and docs sites before you chase niche rich results.",
      "Keep JSON valid — a single trailing comma can invalidate the whole block. Prefer a single script tag with @graph over multiple conflicting graphs when you can.",
      `Validate on-page with the [JSON-LD schema inspector](${routes.schema}), then confirm rich-result eligibility in Google’s tester when you go live.`,
      "Align schema with visible content. Marking every page as FAQPage when there is no FAQ is a policy risk; SEOHub and manual review both look for that mismatch.",
      `For local businesses, extend Organization into LocalBusiness with consistent NAP. Pair that work with the habits in our [guides index](${routes.guides}) and a [fresh site scan](${routes.home}).`,
      "Article and BlogPosting types help news and blog templates. Include datePublished, headline, and author or Organization as publisher — empty required fields undermine eligibility.",
      "After deploy, re-scan so schema and org-schema checklist items flip to pass. Client-rendered JSON-LD that never appears in the first HTML response may still be missed by simple fetch-based tools.",
      "Version your schema in code review the same way you version meta tags. Copy-pasted examples from old docs often ship deprecated properties.",
      "When assistants summarize your brand, clear Organization data (name, url, logo, sameAs) improves entity grounding — the same fundamentals SEOHub’s AI visibility checks look for.",
      `Browse related [free tools](${routes.tools}) for headers, robots, and redirects when technical access issues would block crawlers from seeing your new JSON-LD at all.`,
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
