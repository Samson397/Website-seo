import { routes } from "@/lib/routes";

export type CompareRow = {
  dimension: string;
  seohub: string;
  other: string;
};

export type ComparePage = {
  slug: string;
  /** Short name of the alternative (or category) */
  competitor: string;
  title: string;
  description: string;
  eyebrow: string;
  /** Honest one-liner under the hero */
  positioning: string;
  summary: string[];
  rows: CompareRow[];
  chooseSeoHubWhen: string[];
  chooseOtherWhen: string[];
  faqs: Array<{ q: string; a: string }>;
  relatedCompareSlugs?: string[];
};

export const COMPARE_PAGES: ComparePage[] = [
  {
    slug: "seohub-vs-ahrefs",
    competitor: "Ahrefs",
    title: "SEOHub vs Ahrefs",
    description:
      "Honest comparison: Ahrefs leads on backlink graphs and keyword research depth. SEOHub is a browser-first weekly site audit with pay-per-scan pricing — not a backlink suite.",
    eyebrow: "Compare",
    positioning:
      "Different jobs. Ahrefs is a research platform. SEOHub is a weekly technical audit you run in the browser.",
    summary: [
      "Ahrefs wins on backlink indexes, competitor link graphs, and deep keyword databases — SEOHub does not try to replace that.",
      "SEOHub wins when you want a clear Pass/Fail crawl of your own site, free tools without a login, and a one-time unlock instead of a seat subscription.",
      "Use Ahrefs for link opportunity research; use SEOHub for “what’s broken on my site this week?”",
    ],
    rows: [
      {
        dimension: "Primary job",
        seohub: "Browser-first weekly site audit + free technical tools",
        other: "SEO research suite (backlinks, keywords, content, rank tracking)",
      },
      {
        dimension: "Backlink index",
        seohub: "Not a backlink product — we don’t claim to beat Ahrefs here",
        other: "Industry-leading live backlink and referring-domain graphs",
      },
      {
        dimension: "Site crawl / audit",
        seohub: "Full-site crawl (up to 200 pages) with Pass/Fail checklist",
        other: "Site Audit exists inside a broader subscription workspace",
      },
      {
        dimension: "Pricing model",
        seohub: "Free preview + pay-per-scan unlock (no account required)",
        other: "Monthly/annual seat subscriptions",
      },
      {
        dimension: "Best for",
        seohub: "Founders and marketers who audit occasionally",
        other: "Agencies and SEOs who live in link + keyword research daily",
      },
    ],
    chooseSeoHubWhen: [
      "You need a clear fix list from a public HTML crawl this week",
      "You prefer pay-per-scan over another SaaS login",
      "You want free checkers (headers, redirects, schema, broken links) without signup",
    ],
    chooseOtherWhen: [
      "You need a large backlink index or link-building outreach workflows",
      "You rely on deep competitor keyword databases every day",
      "Your team needs multi-seat research workspaces",
    ],
    faqs: [
      {
        q: "Does SEOHub beat Ahrefs on backlinks?",
        a: "No. Ahrefs is built around backlink data. SEOHub is a browser-first weekly audit and pay-per-scan checklist — not a backlink suite.",
      },
      {
        q: "Can I use both?",
        a: "Yes. Many teams use Ahrefs for research and SEOHub for a fast, honest crawl of their own site before shipping fixes.",
      },
    ],
    relatedCompareSlugs: [
      "seohub-vs-semrush",
      "seohub-vs-ubersuggest",
      "best-free-seo-tools",
    ],
  },
  {
    slug: "seohub-vs-semrush",
    competitor: "Semrush",
    title: "SEOHub vs Semrush",
    description:
      "SEOHub vs Semrush: Semrush is an all-in-one marketing suite. SEOHub is a focused weekly site audit with freemium pay-per-scan pricing — honest about what each product does best.",
    eyebrow: "Compare",
    positioning:
      "Semrush covers SEO, PPC, content, and social in one subscription. SEOHub stays narrow: crawl, checklist, fix.",
    summary: [
      "Semrush is a broad marketing platform — keyword tools, ads research, content marketing, and site audit inside a paid workspace.",
      "SEOHub does not try to be an all-in-one suite. It’s a browser-first weekly audit: scores, Pass/Fail checks, exports, and free technical tools.",
      "Pick Semrush when your team lives in marketing research daily; pick SEOHub when you want a clear site fix list without a subscription.",
    ],
    rows: [
      {
        dimension: "Primary job",
        seohub: "Weekly technical / on-page site audit",
        other: "All-in-one SEO + marketing research platform",
      },
      {
        dimension: "Backlinks & competitive intel",
        seohub: "Not positioned as a backlink or PPC research tool",
        other: "Large databases for links, keywords, and ads",
      },
      {
        dimension: "Site audit depth",
        seohub: "HTML crawl up to 200 pages + free homepage preview",
        other: "Site Audit projects inside the Semrush workspace",
      },
      {
        dimension: "Pricing model",
        seohub: "Free tools + one-time unlock per full scan",
        other: "Tiered monthly subscriptions",
      },
      {
        dimension: "Account required",
        seohub: "No — scan and tools work without signup",
        other: "Yes — workspace login for most features",
      },
    ],
    chooseSeoHubWhen: [
      "You want Pass/Fail fixes for your own site without another subscription",
      "You audit occasionally and prefer pay-per-scan",
      "You need free technical checkers that run in the browser",
    ],
    chooseOtherWhen: [
      "You need PPC, content marketing, and SEO research in one suite",
      "Your agency runs ongoing projects across many clients in one workspace",
      "You depend on Semrush’s competitive keyword and ads databases",
    ],
    faqs: [
      {
        q: "Is SEOHub a Semrush alternative for backlinks?",
        a: "No. Semrush’s strength includes competitive and backlink research. SEOHub focuses on crawling your site and listing clear fixes.",
      },
      {
        q: "Does SEOHub replace Semrush Site Audit?",
        a: "It can replace a light weekly audit for small sites. Heavy multi-project agency workflows still fit Semrush better.",
      },
    ],
    relatedCompareSlugs: [
      "seohub-vs-ahrefs",
      "seohub-vs-ubersuggest",
      "seohub-vs-free-seo-checkers",
    ],
  },
  {
    slug: "seohub-vs-ubersuggest",
    competitor: "Ubersuggest",
    title: "SEOHub vs Ubersuggest",
    description:
      "Compare SEOHub and Ubersuggest: keyword ideas vs weekly technical audits. Honest framing for founders choosing a lighter SEO workflow.",
    eyebrow: "Compare",
    positioning:
      "Ubersuggest leans into keyword ideas and simpler research. SEOHub leans into crawl + Pass/Fail technical checks.",
    summary: [
      "Ubersuggest is known for accessible keyword suggestions and lighter competitive snapshots.",
      "SEOHub is built around scanning a public site: scores, checklist, redirects, schema, headers, broken links, and a paid full-site crawl when you need it.",
      "If your bottleneck is “what keywords should I target?”, start with research tools. If it’s “what’s broken on my pages?”, start with SEOHub.",
    ],
    rows: [
      {
        dimension: "Primary job",
        seohub: "Site audit, technical checkers, pay-per-scan unlock",
        other: "Keyword ideas and lighter SEO research",
      },
      {
        dimension: "Technical crawl",
        seohub: "Homepage preview + optional full-site crawl (up to 200 pages)",
        other: "Site audit features vary by plan; research-first product",
      },
      {
        dimension: "Free tools",
        seohub: "Keywords, headers, redirects, schema, broken links, generators",
        other: "Limited free keyword / overview checks with plan gates",
      },
      {
        dimension: "Pricing feel",
        seohub: "No account; pay once per deep crawl",
        other: "Freemium research with subscription upgrades",
      },
    ],
    chooseSeoHubWhen: [
      "You already know your topics and need technical / on-page fixes",
      "You want free inspectors without creating an account",
      "You prefer unlocking one crawl instead of a monthly research seat",
    ],
    chooseOtherWhen: [
      "You mainly need keyword brainstorming and content ideas",
      "You’re comfortable inside Neil Patel’s research UI and plans",
      "You want lighter competitive overview reports more than a crawl checklist",
    ],
    faqs: [
      {
        q: "Does SEOHub include Ubersuggest-style keyword volume?",
        a: "SEOHub extracts on-page phrases and Google suggestions; richer volume needs optional DataForSEO keys. It is not positioned as a keyword database product.",
      },
    ],
    relatedCompareSlugs: [
      "seohub-vs-ahrefs",
      "seohub-vs-semrush",
      "best-free-seo-tools",
    ],
  },
  {
    slug: "seohub-vs-free-seo-checkers",
    competitor: "Free SEO checkers",
    title: "SEOHub vs free SEO checkers",
    description:
      "How SEOHub compares to one-off free SEO score widgets: deeper crawl options, Pass/Fail fixes, and a toolkit — still honest that free score-only tools have a place.",
    eyebrow: "Compare",
    positioning:
      "Most free checkers give a homepage grade. SEOHub starts there — then offers a full-site unlock and real technical tools.",
    summary: [
      "Free score widgets are fine for a quick gut check. They rarely show sitewide duplicates, crawl coverage, or exportable fix lists.",
      "SEOHub’s free tier is a homepage score preview (including AI visibility). The paid unlock expands into a crawl with checklist, fixes, and exports.",
      "You also get standalone free tools — robots, headers, redirects, schema, broken links — without ad-gated popups for every click.",
    ],
    rows: [
      {
        dimension: "Free output",
        seohub: "Homepage scores + top issue titles; full fixes on unlock",
        other: "Often a single grade or short checklist with soft upsells",
      },
      {
        dimension: "Sitewide crawl",
        seohub: "Optional paid crawl up to 200 pages",
        other: "Usually homepage-only",
      },
      {
        dimension: "Toolkit",
        seohub: "Keywords, meta preview, technical inspectors, generators",
        other: "Varies; many are score-only pages",
      },
      {
        dimension: "Account / email wall",
        seohub: "No account required for tools or preview",
        other: "Common email gates before showing results",
      },
    ],
    chooseSeoHubWhen: [
      "You outgrew a single homepage score",
      "You want Pass/Fail detail and exports for one payment",
      "You need technical checkers next to the audit",
    ],
    chooseOtherWhen: [
      "You only need a 10-second vanity score for a slide",
      "You’re comparing many random URLs casually and don’t need fixes",
    ],
    faqs: [
      {
        q: "Is SEOHub completely free?",
        a: "The homepage preview and toolkit are free. A full-site crawl with complete fixes is a one-time unlock — not a subscription.",
      },
    ],
    relatedCompareSlugs: [
      "best-free-seo-tools",
      "seohub-vs-ubersuggest",
      "seohub-vs-ahrefs",
    ],
  },
  {
    slug: "best-free-seo-tools",
    competitor: "Free SEO tools",
    title: "Best free SEO tools (and where SEOHub fits)",
    description:
      "A practical shortlist of free SEO tools for founders: audits, keywords, technical checks. SEOHub’s free toolkit plus when to pay for a full-site crawl.",
    eyebrow: "Guides",
    positioning:
      "“Best” depends on the job. Here’s an honest split between free research, free technical checks, and when a paid crawl is worth it.",
    summary: [
      "For a weekly health check of your own site, start with SEOHub’s free homepage preview and technical tools — no account.",
      "For deep backlink or enterprise keyword research, free tiers of large suites (Ahrefs, Semrush) are limited; paid research seats still win there.",
      "Pair free Google Search Console + Analytics with a crawl checklist so you fix what you measure.",
    ],
    rows: [
      {
        dimension: "Weekly site audit",
        seohub: "Free homepage scores + paid full crawl when needed",
        other: "Mix of score widgets; few offer honest pay-per-scan depth",
      },
      {
        dimension: "Keyword brainstorming",
        seohub: "On-page phrases + Google suggestions (optional DataForSEO)",
        other: "Google Keyword Planner, free autocomplete tools, limited suite free tiers",
      },
      {
        dimension: "Technical one-offs",
        seohub: "Headers, robots, redirects, schema, broken links — free",
        other: "Scattered single-purpose checkers across the web",
      },
      {
        dimension: "Backlink research",
        seohub: "Out of scope — use a dedicated backlink product",
        other: "Ahrefs / Semrush / similar (paid for real coverage)",
      },
    ],
    chooseSeoHubWhen: [
      "You want one place for free technical checks next to a scan",
      "You’re ready to unlock one full-site report without a subscription",
      "You care about Pass/Fail clarity more than research databases",
    ],
    chooseOtherWhen: [
      "Your main job is link building or large-scale keyword research",
      "You already live in Search Console and only need a second opinion occasionally",
    ],
    faqs: [
      {
        q: "What free SEOHub tools should I try first?",
        a: "Start with a homepage scan, then Meta & SERP preview, robots/sitemap inspector, and broken link checker for the templates that matter most.",
      },
      {
        q: "When should I pay for a full scan?",
        a: "When homepage scores aren’t enough — you need sitewide duplicates, crawl coverage, exports, and the complete fix list.",
      },
    ],
    relatedCompareSlugs: [
      "seohub-vs-free-seo-checkers",
      "seohub-vs-ahrefs",
      "seohub-vs-semrush",
    ],
  },
];

export function getComparePage(slug: string): ComparePage | undefined {
  return COMPARE_PAGES.find((p) => p.slug === slug);
}

export function comparePath(slug: string): string {
  return `${routes.compare}/${slug}`;
}

export const COMPARE_INDEX = {
  title: "SEOHub comparisons",
  description:
    "Honest comparisons: SEOHub vs Ahrefs, Semrush, Ubersuggest, and free SEO checkers. Browser-first weekly audits — not a backlink suite.",
} as const;
