export type PlatformAudit = {
  slug: string;
  name: string;
  /** Short label for lists */
  shortName: string;
  title: string;
  description: string;
  /** Hero supporting sentence */
  summary: string;
  /** Opening paragraphs — must be unique per platform */
  intro: string[];
  /** Platform-specific SEO failures teams hit most often */
  commonFailures: { title: string; detail: string }[];
  /** Checklist items that differ from a generic site audit */
  checklist: string[];
  /** Why this platform needs a tailored pass */
  whyDifferent: string;
  ctaLabel: string;
};

export const PLATFORM_AUDITS: PlatformAudit[] = [
  {
    slug: "shopify",
    name: "Shopify",
    shortName: "Shopify",
    title: "SEO audit for Shopify stores",
    description:
      "Find Shopify SEO failures: thin collection pages, duplicate product variants, theme meta gaps, and slow Liquid-rendered templates. Free homepage scan from SEOHub.",
    summary:
      "Check the homepage and key templates Shopify themes often leave thin, duplicated, or blocked from indexing.",
    intro: [
      "Shopify ships a solid ecommerce foundation, but default themes and app stacks create predictable SEO debt. Collection pages often inherit thin copy, product variants can spawn near-duplicate URLs, and apps inject scripts that slow LCP on mobile.",
      "A Shopify-focused audit prioritizes theme Liquid output (titles, canonicals, JSON-LD Product), robots rules for /collections and /products filters, and whether your sitemap.xml lists the SKUs you actually want indexed.",
    ],
    commonFailures: [
      {
        title: "Filter and sort URLs indexed as unique pages",
        detail:
          "Collection filters (?sort_by=, tag URLs) frequently get crawled without noindex or canonical consolidation, splitting ranking signals across thin parameter pages.",
      },
      {
        title: "Duplicate titles across product variants",
        detail:
          "Color/size variants sometimes share identical <title> and meta description strings, or point canonicals at the wrong parent product URL.",
      },
      {
        title: "App-injected scripts hurting Core Web Vitals",
        detail:
          "Reviews, upsell, and chat apps load third-party JS on every template. Homepage and collection LCP often fail before content SEO is even reviewed.",
      },
      {
        title: "Missing or incomplete Product structured data",
        detail:
          "Themes may omit price, availability, or sku in JSON-LD — or ship conflicting Product + Offer blocks from multiple apps.",
      },
    ],
    checklist: [
      "Confirm /sitemap.xml includes products, collections, pages, and blogs you want indexed — not every tagged filter URL.",
      "Verify self-referencing canonicals on product and collection templates in the live HTML (not only in the theme editor preview).",
      "Check robots.txt does not block /cdn/ or critical assets while still limiting faceted crawl paths.",
      "Validate Product JSON-LD on a bestseller and a sold-out SKU.",
      "Measure homepage and collection LCP on mobile after disabling unused apps.",
      "Ensure blog articles (if used) have unique titles and are linked from the storefront nav or footer.",
    ],
    whyDifferent:
      "Shopify SEO fails at the template and app layer more than at “missing meta tags.” You need checks that understand Liquid themes, variant URLs, and the hosted sitemap Shopify generates.",
    ctaLabel: "Scan your Shopify homepage free",
  },
  {
    slug: "wordpress",
    name: "WordPress",
    shortName: "WordPress",
    title: "SEO audit for WordPress sites",
    description:
      "Audit WordPress SEO: plugin conflicts, Yoast/Rank Math gaps, crawl-waste archives, and insecure headers. Free homepage scan from SEOHub.",
    summary:
      "Surface plugin bloat, archive crawl waste, and on-page gaps that classic WordPress installs accumulate over time.",
    intro: [
      "WordPress powers everything from brochure sites to publishers — and SEO outcomes depend heavily on theme quality plus which SEO plugin (if any) owns titles, canonicals, and sitemaps.",
      "A WordPress audit looks beyond the homepage: category and tag archives, author pages, attachment URLs, and conflicting plugins that output duplicate Open Graph or JSON-LD are where rankings quietly erode.",
    ],
    commonFailures: [
      {
        title: "Indexable tag, author, and date archives",
        detail:
          "Default permalinks expose thin archive templates that compete with real posts. Many sites never noindex or remove these from the XML sitemap.",
      },
      {
        title: "SEO plugin vs theme fighting for meta output",
        detail:
          "Themes that hardcode title tags alongside Yoast or Rank Math create duplicate or empty meta. The live HTML often differs from what the plugin preview shows.",
      },
      {
        title: "Media and attachment pages in the index",
        detail:
          "Uploading images can create attachment URLs with almost no content. They waste crawl budget and dilute topical focus.",
      },
      {
        title: "Stale plugins slowing TTFB and LCP",
        detail:
          "Page builders, sliders, and unused caching plugins stack render-blocking CSS/JS. WordPress homepage audits frequently fail performance before content checks.",
      },
    ],
    checklist: [
      "Confirm one SEO plugin owns titles, canonicals, and sitemaps — disable theme SEO modules that duplicate them.",
      "Noindex or remove thin taxonomies (tags, authors) from the XML sitemap if they lack unique value.",
      "Redirect or disable attachment pages; serve images from the media library without indexable wrappers.",
      "Check robots.txt and security plugins are not blocking /wp-content/uploads/ needed assets.",
      "Validate Organization/WebSite schema once — not once per plugin.",
      "Review homepage H1: page builders often bury or duplicate headings.",
    ],
    whyDifferent:
      "WordPress SEO is a plugin-and-taxonomy problem as much as an on-page one. Generic audits miss archive indexation and conflicting meta generators.",
    ctaLabel: "Scan your WordPress homepage free",
  },
  {
    slug: "wix",
    name: "Wix",
    shortName: "Wix",
    title: "SEO audit for Wix websites",
    description:
      "Find Wix SEO issues: thin Wix ADI pages, duplicate site URLs, missing alt text, and mobile layout CLS. Free homepage scan from SEOHub.",
    summary:
      "Catch Wix editor defaults that leave pages thin, slow on mobile, or poorly linked for crawlers.",
    intro: [
      "Wix makes publishing easy, but the drag-and-drop editor encourages decorative sections over crawlable HTML structure. Many Wix sites ship with generic titles, sparse text nodes, and image-heavy heroes that hurt LCP.",
      "An SEOHub Wix audit focuses on what Google actually receives: rendered titles and descriptions from Wix SEO settings, whether important pages are in the auto sitemap, and whether mobile sticky chrome causes layout shift.",
    ],
    commonFailures: [
      {
        title: "Default or site-wide identical meta titles",
        detail:
          "ADI and template sites often reuse the business name as every page title. SERPs look identical and rankings stall.",
      },
      {
        title: "Text locked inside images or canvas-like sections",
        detail:
          "Key headlines baked into graphics never appear as HTML text, so keyword relevance and accessibility both suffer.",
      },
      {
        title: "Shallow internal linking from the homepage",
        detail:
          "Wix menus can hide deep pages behind interactions that crawlers under-follow. Important service pages stay orphaned.",
      },
      {
        title: "Mobile CLS from sticky headers and animations",
        detail:
          "Editor animations and sticky strips push content after paint. Core Web Vitals fail even when desktop looks polished.",
      },
    ],
    checklist: [
      "Set unique SEO title and description per page in Wix SEO (Advanced SEO) — verify in live source.",
      "Ensure primary keywords appear in real text elements, not only in image alt or graphics.",
      "Confirm the Wix-generated sitemap lists every money page; submit the same URL in Search Console.",
      "Add descriptive alt text on hero and gallery images; compress oversized media.",
      "Test mobile LCP/CLS with animations reduced or removed on the homepage.",
      "Link footer or homepage sections to contact, pricing, and top service URLs with plain <a> links.",
    ],
    whyDifferent:
      "Wix SEO lives inside the editor’s SEO panel and the hosted sitemap. Audits need to verify rendered output, not assume classic CMS template fields.",
    ctaLabel: "Scan your Wix homepage free",
  },
  {
    slug: "webflow",
    name: "Webflow",
    shortName: "Webflow",
    title: "SEO audit for Webflow sites",
    description:
      "Audit Webflow SEO: CMS collection SEO fields, client-side interactions blocking crawl, and custom code conflicts. Free homepage scan from SEOHub.",
    summary:
      "Validate Webflow CMS SEO fields, published canonicals, and interaction-heavy pages that under-deliver HTML.",
    intro: [
      "Webflow gives designers pixel control — and that freedom creates SEO gaps when CMS templates omit meta fields or interactions hide primary content until click.",
      "A Webflow audit checks collection-level SEO title bindings, whether draft/staging domains leak into production canonicals, and if custom <head> code conflicts with Webflow’s native Open Graph tags.",
    ],
    commonFailures: [
      {
        title: "CMS items missing bound SEO title/description",
        detail:
          "Designers style the template but leave SEO fields empty. Hundreds of CMS items inherit the site name only.",
      },
      {
        title: "Staging or .webflow.io URLs in canonicals/sitemaps",
        detail:
          "Misconfigured custom domains or leftover project links cause self-canonicals to point at the wrong host.",
      },
      {
        title: "Content revealed only via interactions",
        detail:
          "Tabs, sliders, and “load more” patterns can leave primary copy out of the initial HTML, reducing relevance signals.",
      },
      {
        title: "Duplicate Open Graph from custom code embeds",
        detail:
          "Marketing embeds paste extra og:title tags on top of Webflow’s page settings, confusing social previews and some crawlers.",
      },
    ],
    checklist: [
      "Bind SEO title and meta description fields on every CMS collection template; spot-check three live items.",
      "Confirm production canonical host matches the custom domain (HTTPS, preferred www/apex).",
      "Ensure critical copy exists in the DOM without requiring interaction.",
      "Audit custom code in Project Settings → Custom Code for duplicate meta/schema.",
      "Check the Webflow sitemap includes CMS collections you want indexed; exclude utility pages.",
      "Validate heading hierarchy: Webflow projects often use multiple H1s for visual size.",
    ],
    whyDifferent:
      "Webflow SEO is template-and-binding driven. Failures scale across CMS collections when one field is unbound — a pattern generic page audits under-emphasize.",
    ctaLabel: "Scan your Webflow homepage free",
  },
  {
    slug: "squarespace",
    name: "Squarespace",
    shortName: "Squarespace",
    title: "SEO audit for Squarespace sites",
    description:
      "Find Squarespace SEO gaps: portfolio thin pages, cover-page indexation, and slow image galleries. Free homepage scan from SEOHub.",
    summary:
      "Review Squarespace templates for thin portfolio pages, cover-page SEO settings, and gallery-heavy performance issues.",
    intro: [
      "Squarespace templates look refined out of the box, but creative portfolios and cover pages often ship with minimal crawlable text and heavy image sets.",
      "This audit focuses on page SEO titles vs. browser titles, whether cover pages are indexable when they should redirect, and if blog or product modules inherit duplicate descriptions.",
    ],
    commonFailures: [
      {
        title: "Cover pages indexed instead of the main site",
        detail:
          "Launch cover pages left indexable compete with the real homepage or create soft doorways with almost no content.",
      },
      {
        title: "Portfolio items with title-only content",
        detail:
          "Gallery project pages frequently lack unique body copy, so Google treats them as thin or duplicate.",
      },
      {
        title: "Oversized gallery images without modern formats",
        detail:
          "Squarespace sites often serve large JPEGs on the homepage; LCP suffers especially on mobile connections.",
      },
      {
        title: "Blog SEO titles not matching visible headlines",
        detail:
          "Separate “SEO title” fields diverge from H1s, and truncated defaults get published unchanged.",
      },
    ],
    checklist: [
      "Set SEO titles and descriptions under each page’s SEO tab; confirm they appear in live HTML.",
      "Noindex or unpublish cover pages once the full site is live.",
      "Add unique text to portfolio/project pages — not only images and captions.",
      "Compress and size homepage gallery assets; prefer fewer above-the-fold images.",
      "Check the Squarespace sitemap for unintended utility or checkout-adjacent URLs.",
      "Verify HTTPS and preferred domain redirects (www vs apex) are consistent.",
    ],
    whyDifferent:
      "Squarespace SEO hinges on per-page SEO panels and cover/portfolio patterns that classic CMS checklists rarely call out.",
    ctaLabel: "Scan your Squarespace homepage free",
  },
  {
    slug: "framer",
    name: "Framer",
    shortName: "Framer",
    title: "SEO audit for Framer sites",
    description:
      "Audit Framer SEO: client-rendered content gaps, missing meta on CMS pages, and animation-heavy LCP. Free homepage scan from SEOHub.",
    summary:
      "Check whether Framer pages expose crawlable HTML, unique meta, and acceptable performance despite motion-heavy designs.",
    intro: [
      "Framer is built for interactive marketing sites. Motion and components look great — but crawlers and performance budgets need the primary message in the initial document, not only after hydration.",
      "A Framer SEO audit verifies page-level SEO settings, CMS slug uniqueness, Open Graph images, and whether heavy effects delay Largest Contentful Paint on the homepage.",
    ],
    commonFailures: [
      {
        title: "Primary copy delayed until client render",
        detail:
          "If key headlines depend on effects or late-loaded components, some crawlers see sparse HTML on first fetch.",
      },
      {
        title: "CMS pages sharing default site meta",
        detail:
          "Collection pages publish without unique titles/descriptions when SEO fields were never mapped in the CMS.",
      },
      {
        title: "Animation and video heroes inflating LCP",
        detail:
          "Full-bleed motion heroes and autoplay video push LCP well past competitive thresholds on mobile.",
      },
      {
        title: "Broken or missing canonical on localized paths",
        detail:
          "Locale or variant routes sometimes omit self-canonicals, creating duplicate clusters across language or campaign paths.",
      },
    ],
    checklist: [
      "Set unique title and description for Home and each CMS template in Framer’s SEO controls.",
      "View page source (or fetch HTML) to confirm H1 and intro text appear without interaction.",
      "Optimize hero media: static image fallback, compressed assets, restrained autoplay.",
      "Confirm production domain, redirects, and sitemap after connecting a custom host.",
      "Add meaningful alt text on key frames and CMS images.",
      "Validate one CMS detail page for canonical, OG image, and structured data if used.",
    ],
    whyDifferent:
      "Framer sits between design tool and CMS. SEO failures cluster around render timing and CMS field mapping — not classic plugin conflicts.",
    ctaLabel: "Scan your Framer homepage free",
  },
  {
    slug: "ghost",
    name: "Ghost",
    shortName: "Ghost",
    title: "SEO audit for Ghost publications",
    description:
      "Find Ghost SEO issues: tag archive thinness, card-only homepage content, and newsletter pages competing with posts. Free homepage scan from SEOHub.",
    summary:
      "Tune Ghost themes for publisher SEO — tags, canonicals, and homepage modules that stay crawl-friendly.",
    intro: [
      "Ghost is optimized for publishing, with clean markup and built-in meta helpers. Rankings still slip when themes underuse custom excerpts, when tag pages are thin, or when membership routes leak into the sitemap.",
      "This audit emphasizes publisher patterns: article schema, tag/topic hubs, RSS vs HTML discovery, and whether the homepage surfaces enough unique text beyond post cards.",
    ],
    commonFailures: [
      {
        title: "Tag archives with no unique intro copy",
        detail:
          "Ghost tag pages often list posts only. Without editorial intros they look thin next to competing topic hubs.",
      },
      {
        title: "Homepage that is only a card grid",
        detail:
          "Card titles and excerpts may not provide enough unique on-page text for brand queries or topical authority.",
      },
      {
        title: "Membership and account routes indexed",
        detail:
          "Sign-in, account, and checkout-adjacent URLs sometimes appear in sitemaps or internal links without noindex.",
      },
      {
        title: "Missing or generic custom excerpts",
        detail:
          "Posts fall back to truncated body text for meta descriptions, producing awkward SERP snippets.",
      },
    ],
    checklist: [
      "Write custom excerpts (and meta when using SEO fields) for cornerstone posts.",
      "Add unique intro content on important tags; noindex low-value tags.",
      "Keep membership/portal URLs out of the index and sitemap.",
      "Confirm theme outputs Article/BlogPosting JSON-LD without duplication.",
      "Ensure canonical URLs use the production Publication URL setting.",
      "Link from homepage or nav to cornerstone guides — not only the latest posts feed.",
    ],
    whyDifferent:
      "Ghost SEO is publisher-centric: tags, excerpts, and membership routes matter more than ecommerce schema or product variants.",
    ctaLabel: "Scan your Ghost homepage free",
  },
  {
    slug: "hubspot-cms",
    name: "HubSpot CMS",
    shortName: "HubSpot CMS",
    title: "SEO audit for HubSpot CMS",
    description:
      "Audit HubSpot CMS SEO: landing-page template duplication, module-level meta gaps, and gated-asset indexation. Free homepage scan from SEOHub.",
    summary:
      "Catch HubSpot CMS template duplication, landing-page SEO drift, and gated pages that should stay out of the index.",
    intro: [
      "HubSpot CMS blends marketing landing pages, blogs, and website pages in one hub. Teams ship fast with modules — and accidentally clone thin landing pages that cannibalize each other.",
      "A HubSpot-focused audit reviews page title fields vs. H1s, whether thank-you and gated URLs are noindexed, and if blog tags/authors create crawl waste alongside paid landing pages.",
    ],
    commonFailures: [
      {
        title: "Near-duplicate landing pages for every campaign",
        detail:
          "Cloned templates change a headline but keep identical body blocks, meta patterns, and CTAs — classic cannibalization.",
      },
      {
        title: "Thank-you and gated assets indexed",
        detail:
          "Form confirmation and download URLs attract soft traffic and dilute the site’s indexable set when left crawlable.",
      },
      {
        title: "Blog and website domains mixed without clear canonicals",
        detail:
          "Subdomain blogs (e.g., blog.brand.com) and www pages compete if internal links and canonicals disagree.",
      },
      {
        title: "Module-driven pages missing unique meta",
        detail:
          "Global modules overwrite or omit page-level descriptions when SEO fields weren’t required in the content type.",
      },
    ],
    checklist: [
      "Require unique SEO title and meta description on every published website and landing page.",
      "Noindex thank-you, preference-center, and gated delivery URLs.",
      "Map a clear host strategy for blog vs website; align canonicals and internal links.",
      "Audit cloned campaign pages for unique body content — not just UTM-driven headlines.",
      "Validate HubSpot’s XML sitemap excludes utility and CRM portal paths.",
      "Check homepage modules for a single clear H1 and crawlable CTA links.",
    ],
    whyDifferent:
      "HubSpot SEO problems are campaign-and-template driven: duplication and gated routes dominate over classic theme bugs.",
    ctaLabel: "Scan your HubSpot CMS homepage free",
  },
  {
    slug: "bigcommerce",
    name: "BigCommerce",
    shortName: "BigCommerce",
    title: "SEO audit for BigCommerce stores",
    description:
      "Find BigCommerce SEO failures: faceted navigation crawl waste, stencil theme meta gaps, and product schema issues. Free homepage scan from SEOHub.",
    summary:
      "Review BigCommerce faceted URLs, Stencil theme SEO fields, and product pages that leak duplicate signals.",
    intro: [
      "BigCommerce Stencil themes provide strong ecommerce primitives, but faceted navigation and category structures can explode crawlable URL counts if left unchecked.",
      "This audit prioritizes category/product canonical strategy, whether filtered URLs are indexed, and if Product structured data matches visible price and availability on Stencil storefronts.",
    ],
    commonFailures: [
      {
        title: "Faceted navigation creating indexable URL floods",
        detail:
          "Brand, price, and attribute filters generate thousands of thin URLs unless robots, canonicals, or noindex rules are applied.",
      },
      {
        title: "Category pages with little unique copy",
        detail:
          "Default category templates list products only. Competing category hubs win with editorial content and clearer internal links.",
      },
      {
        title: "Inconsistent product URL suffixes and duplicates",
        detail:
          "Alternate product URLs or session parameters appear without consolidation to the preferred product path.",
      },
      {
        title: "Schema price/availability mismatches",
        detail:
          "JSON-LD that disagrees with on-page pricing or stock status triggers rich-result warnings and trust issues.",
      },
    ],
    checklist: [
      "Define a faceted SEO policy: canonical to clean category URLs; noindex or robots-disallow low-value filters.",
      "Add unique category descriptions above or below the product grid.",
      "Confirm product pages emit accurate Product/Offer JSON-LD.",
      "Review the BigCommerce sitemap for products, categories, and brand pages you intend to rank.",
      "Test homepage and category LCP with apps and theme scripts minimized.",
      "Ensure HTTPS and preferred domain redirects are consistent across cart and checkout hosts if split.",
    ],
    whyDifferent:
      "BigCommerce SEO risk concentrates in facets and category templates — ecommerce crawl control more than brochure-site meta edits.",
    ctaLabel: "Scan your BigCommerce homepage free",
  },
  {
    slug: "woocommerce",
    name: "WooCommerce",
    shortName: "WooCommerce",
    title: "SEO audit for WooCommerce stores",
    description:
      "Audit WooCommerce SEO: product category thinness, filter crawl waste, and WordPress+Woo plugin conflicts. Free homepage scan from SEOHub.",
    summary:
      "Combine WordPress and ecommerce checks: WooCommerce products, categories, filters, and plugin SEO output.",
    intro: [
      "WooCommerce inherits WordPress flexibility — and its SEO complexity. Product, product_cat, and filter endpoints interact with SEO plugins, page builders, and caching layers in ways brochure WordPress sites never see.",
      "A WooCommerce audit stresses product/category indexation, whether layered nav creates crawl traps, and if Product schema from WooCommerce core conflicts with Yoast/Rank Math ecommerce add-ons.",
    ],
    commonFailures: [
      {
        title: "Layered navigation and filter URLs indexed",
        detail:
          "Filter query strings and attribute archives often enter the index as thin duplicates of category pages.",
      },
      {
        title: "Product short descriptions used as thin unique content",
        detail:
          "Many catalogs rely on manufacturer blurbs reused across SKUs, triggering duplicate-content patterns.",
      },
      {
        title: "Cart, checkout, and account endpoints crawlable",
        detail:
          "Misconfigured robots or sitemaps expose utility ecommerce URLs that should stay out of the index.",
      },
      {
        title: "Conflicting Product schema from multiple plugins",
        detail:
          "WooCommerce, SEO plugins, and review apps each inject JSON-LD — validators report duplicates or errors.",
      },
    ],
    checklist: [
      "Noindex cart, checkout, my-account, and thank-you routes; keep them out of XML sitemaps.",
      "Configure SEO plugin ecommerce settings for product canonicals and category noindex rules where needed.",
      "Write unique category intros and differentiate product long descriptions on priority SKUs.",
      "Control attribute/filter crawl with robots, canonicals, or plugin facet settings.",
      "Keep a single Product schema source; remove duplicate JSON-LD emitters.",
      "Re-test homepage and category performance with page builder and related-products scripts.",
    ],
    whyDifferent:
      "WooCommerce is WordPress plus a full product graph. Audits must cover ecommerce routes and facet crawl — not only post SEO.",
    ctaLabel: "Scan your WooCommerce homepage free",
  },
];

export function getPlatformAudit(slug: string): PlatformAudit | undefined {
  return PLATFORM_AUDITS.find((p) => p.slug === slug);
}

export function platformAuditPath(slug: string): string {
  return `/audit/${slug}`;
}

/** Homepage scan CTA — plain home URL (no query variants that create duplicate titles). */
export function platformScanCtaHref(_slug: string): string {
  return "/";
}
