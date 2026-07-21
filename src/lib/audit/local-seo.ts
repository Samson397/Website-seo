import * as cheerio from "cheerio";
import type { AuditIssue } from "@/lib/types";
import { createIssue } from "@/lib/types";

/**
 * Local SEO signals from public HTML (no GBP API required).
 */
export function runLocalSeoAudit(html: string, pageUrl: string): AuditIssue[] {
  const $ = cheerio.load(html);
  const issues: AuditIssue[] = [];
  const text = $("body").text().replace(/\s+/g, " ");

  const jsonLdBlocks: unknown[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      jsonLdBlocks.push(JSON.parse($(el).html() || ""));
    } catch {
      /* ignore */
    }
  });

  const flatTypes: string[] = [];
  const walk = (node: unknown) => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node === "object") {
      const obj = node as Record<string, unknown>;
      if (obj["@type"]) {
        const t = obj["@type"];
        if (Array.isArray(t)) flatTypes.push(...t.map(String));
        else flatTypes.push(String(t));
      }
      if (obj["@graph"]) walk(obj["@graph"]);
      for (const v of Object.values(obj)) {
        if (v && typeof v === "object") walk(v);
      }
    }
  };
  jsonLdBlocks.forEach(walk);

  const hasLocalBusiness = flatTypes.some((t) =>
    /LocalBusiness|Dentist|Restaurant|Store|MedicalBusiness|ProfessionalService|HomeAndConstructionBusiness/i.test(
      t
    )
  );

  const telLinks = $('a[href^="tel:"]').length;
  const mapsLinks = $('a[href*="google.com/maps"], a[href*="maps.google"], a[href*="goo.gl/maps"]').length;
  const addressLike =
    /(\d{1,5}\s+[\w\s.'-]{3,40}\b(street|st|road|rd|avenue|ave|lane|ln|drive|dr|boulevard|blvd)\b)/i.test(
      text
    ) || $('[itemprop="address"], address').length > 0;

  const looksLocal =
    hasLocalBusiness ||
    mapsLinks > 0 ||
    (/near me|opening hours|our location|visit us|book an appointment/i.test(text) &&
      (telLinks > 0 || addressLike));

  if (!looksLocal) {
    return issues; // don't spam national/informational sites
  }

  if (!hasLocalBusiness) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "Missing LocalBusiness schema",
        description:
          "This page looks local, but no LocalBusiness (or subtype) JSON-LD was found. Local pack eligibility benefits from clear entity markup.",
        recommendation:
          "Add LocalBusiness JSON-LD with name, address, telephone, openingHours, and geo where possible.",
        fixSnippet: `"@type": "LocalBusiness",\n"name": "…",\n"address": { "@type": "PostalAddress", … },\n"telephone": "+44…"`,
      })
    );
  }

  if (telLinks === 0) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "warning",
        title: "No clickable phone number",
        description: "Local pages should expose a tel: link for mobile conversions and NAP consistency.",
        recommendation: 'Add a visible <a href="tel:+…"> phone number matching your Google Business Profile.',
      })
    );
  }

  if (!addressLike) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "Address / NAP text not detected",
        description: "Crawlers and users look for a consistent name, address, and phone on location pages.",
        recommendation: "Publish a full NAP block matching citations and your Business Profile.",
      })
    );
  }

  if (mapsLinks === 0) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "No Google Maps link found",
        description: "A maps link or embed helps validate location and improves local UX.",
        recommendation: "Link to your Google Business Profile / Maps place page from the contact section.",
      })
    );
  }

  const cityHints = text.match(
    /\b(London|Manchester|Edinburgh|Glasgow|Birmingham|Leeds|Bristol|Liverpool|Newcastle|Cardiff|Belfast|Dublin)\b/gi
  );
  if (cityHints && cityHints.length > 0 && !new RegExp(cityHints[0], "i").test($("title").text())) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "Local city not in title",
        description: `Page mentions ${cityHints[0]} but the title may not include the location keyword.`,
        currentValue: $("title").text().slice(0, 80),
        recommendation: `Consider including ${cityHints[0]} in the title for local intent queries.`,
        pagePath: (() => {
          try {
            return new URL(pageUrl).pathname;
          } catch {
            return "/";
          }
        })(),
      })
    );
  }

  return issues;
}
