import * as cheerio from "cheerio";
import { AuditContext, AuditIssue, createIssue } from "@/lib/types";

export interface TechnologyInfo {
  name: string;
  category: string;
}

const TECH_SIGNATURES: { name: string; category: string; test: (ctx: AuditContext) => boolean }[] = [
  {
    name: "WordPress",
    category: "CMS",
    test: (ctx) =>
      /wp-content|wp-includes|wordpress/i.test(ctx.fetchResult.html) ||
      ctx.fetchResult.headers["x-powered-by"]?.includes("WordPress") === true,
  },
  {
    name: "Shopify",
    category: "E-commerce",
    test: (ctx) => /cdn\.shopify\.com|shopify/i.test(ctx.fetchResult.html),
  },
  {
    name: "Wix",
    category: "CMS",
    test: (ctx) => /wix\.com|wixstatic/i.test(ctx.fetchResult.html),
  },
  {
    name: "Squarespace",
    category: "CMS",
    test: (ctx) => /squarespace/i.test(ctx.fetchResult.html),
  },
  {
    name: "Webflow",
    category: "CMS",
    test: (ctx) => /webflow/i.test(ctx.fetchResult.html),
  },
  {
    name: "React",
    category: "Framework",
    test: (ctx) =>
      /react/i.test(ctx.fetchResult.html) ||
      /__NEXT_DATA__|_next\//i.test(ctx.fetchResult.html),
  },
  {
    name: "Next.js",
    category: "Framework",
    test: (ctx) => /__NEXT_DATA__|_next\//i.test(ctx.fetchResult.html),
  },
  {
    name: "Vue.js",
    category: "Framework",
    test: (ctx) => /vue\.js|__VUE__|data-v-/i.test(ctx.fetchResult.html),
  },
  {
    name: "Angular",
    category: "Framework",
    test: (ctx) => /angular|ng-version/i.test(ctx.fetchResult.html),
  },
  {
    name: "jQuery",
    category: "Library",
    test: (ctx) => /jquery/i.test(ctx.fetchResult.html),
  },
  {
    name: "Bootstrap",
    category: "UI Framework",
    test: (ctx) => /bootstrap/i.test(ctx.fetchResult.html),
  },
  {
    name: "Tailwind CSS",
    category: "UI Framework",
    test: (ctx) => /--tw-|tailwindcss/i.test(ctx.fetchResult.html),
  },
  {
    name: "Google Analytics (GA4)",
    category: "Analytics",
    test: (ctx) => /googletagmanager\.com\/gtag|G-[A-Z0-9]+/i.test(ctx.fetchResult.html),
  },
  {
    name: "Google Tag Manager",
    category: "Analytics",
    test: (ctx) => /googletagmanager\.com\/gtm/i.test(ctx.fetchResult.html),
  },
  {
    name: "Facebook Pixel",
    category: "Analytics",
    test: (ctx) => /connect\.facebook\.net|fbq\(/i.test(ctx.fetchResult.html),
  },
  {
    name: "Hotjar",
    category: "Analytics",
    test: (ctx) => /hotjar/i.test(ctx.fetchResult.html),
  },
  {
    name: "Cloudflare",
    category: "CDN",
    test: (ctx) =>
      ctx.fetchResult.headers["server"]?.includes("cloudflare") === true ||
      !!ctx.fetchResult.headers["cf-ray"],
  },
  {
    name: "Vercel",
    category: "Hosting",
    test: (ctx) =>
      ctx.fetchResult.headers["server"]?.includes("Vercel") === true ||
      !!ctx.fetchResult.headers["x-vercel-id"],
  },
  {
    name: "Netlify",
    category: "Hosting",
    test: (ctx) => !!ctx.fetchResult.headers["x-nf-request-id"],
  },
  {
    name: "Stripe",
    category: "Payments",
    test: (ctx) => /js\.stripe\.com/i.test(ctx.fetchResult.html),
  },
  {
    name: "reCAPTCHA",
    category: "Security",
    test: (ctx) => /google\.com\/recaptcha|grecaptcha/i.test(ctx.fetchResult.html),
  },
];

export function detectTechnologies(ctx: AuditContext): TechnologyInfo[] {
  const detected: TechnologyInfo[] = [];
  for (const sig of TECH_SIGNATURES) {
    if (sig.test(ctx)) {
      detected.push({ name: sig.name, category: sig.category });
    }
  }

  const server = ctx.fetchResult.headers["server"];
  if (server && !detected.some((t) => t.category === "Hosting")) {
    detected.push({ name: server, category: "Server" });
  }

  const $ = cheerio.load(ctx.fetchResult.html);
  const generator = $('meta[name="generator"]').attr("content");
  if (generator && !detected.some((t) => t.name.toLowerCase() === generator.toLowerCase())) {
    detected.push({ name: generator, category: "CMS" });
  }

  return detected;
}

export function runTechnologyAudit(
  ctx: AuditContext,
  technologies: TechnologyInfo[]
): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const hasAnalytics = technologies.some((t) => t.category === "Analytics");

  if (!hasAnalytics) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "No analytics detected",
        description:
          "No Google Analytics, GTM, or similar tracking was detected. Analytics help measure traffic and SEO performance.",
        recommendation: "Install Google Analytics 4 or Google Tag Manager.",
        fixSnippet: `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX"></script>`,
      })
    );
  }

  const analytics = technologies.filter((t) => t.category === "Analytics");
  if (analytics.length > 3) {
    issues.push(
      createIssue({
        category: "performance",
        severity: "info",
        title: "Multiple analytics tools detected",
        description: "Too many tracking scripts slow page load and may duplicate data collection.",
        currentValue: analytics.map((t) => t.name).join(", "),
        recommendation: "Consolidate tracking into a single tag manager.",
      })
    );
  }

  if (/jquery[^/]*\/1\.|jquery[^/]*\/2\./i.test(ctx.fetchResult.html)) {
    issues.push(
      createIssue({
        category: "security",
        severity: "warning",
        title: "Outdated jQuery version detected",
        description: "Old jQuery versions have known security vulnerabilities.",
        recommendation: "Upgrade to jQuery 3.7+ or remove jQuery if not needed.",
      })
    );
  }

  return issues;
}
