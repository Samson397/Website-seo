import * as cheerio from "cheerio";
import { AuditContext, AuditIssue, createIssue } from "@/lib/types";

export function runAccessibilityAudit(ctx: AuditContext): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const $ = cheerio.load(ctx.fetchResult.html);

  const lang = $("html").attr("lang");
  if (!lang) {
    issues.push(
      createIssue({
        category: "accessibility",
        severity: "critical",
        title: "Missing language attribute",
        description:
          "Screen readers use the lang attribute to pronounce content correctly. Without it, assistive technology may misread the page.",
        recommendation: 'Add a lang attribute to the <html> tag (e.g., lang="en").',
        fixSnippet: '<html lang="en">',
      })
    );
  }

  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src") || "unknown";
    const alt = $(el).attr("alt");
    if (alt === undefined) {
      const shortSrc = src.length > 60 ? `${src.substring(0, 60)}...` : src;
      issues.push(
        createIssue({
          category: "accessibility",
          severity: "warning",
          title: "Image missing alt text",
          description:
            "Alt text describes images for screen reader users and appears when images fail to load.",
          currentValue: `src="${shortSrc}"`,
          recommendation: 'Add a descriptive alt attribute, or alt="" for decorative images.',
          fixSnippet: `<img src="${src}" alt="Describe what this image shows">`,
        })
      );
    }
  });

  $("input, select, textarea").each((_, el) => {
    const tag = el.tagName.toLowerCase();
    const type = $(el).attr("type") || "";
    if (["hidden", "submit", "button", "reset", "image"].includes(type)) return;

    const id = $(el).attr("id");
    const ariaLabel = $(el).attr("aria-label");
    const ariaLabelledBy = $(el).attr("aria-labelledby");
    const hasLabel =
      (id && $(`label[for="${id}"]`).length > 0) || !!ariaLabel || !!ariaLabelledBy;

    if (!hasLabel) {
      const name = $(el).attr("name") || $(el).attr("placeholder") || tag;
      issues.push(
        createIssue({
          category: "accessibility",
          severity: "warning",
          title: "Form input missing label",
          description:
            "Form inputs need associated labels so screen reader users know what each field is for.",
          currentValue: `<${tag} name="${name}">`,
          recommendation: "Associate a <label> with the input using matching for/id attributes.",
          fixSnippet: `<label for="${id || name}">${name.charAt(0).toUpperCase() + name.slice(1)}</label>
<input type="${type || "text"}" id="${id || name}" name="${name}">`,
        })
      );
    }
  });

  const headings: number[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const level = parseInt(el.tagName.charAt(1), 10);
    headings.push(level);
  });

  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1];
    const curr = headings[i];
    if (curr - prev > 1) {
      issues.push(
        createIssue({
          category: "accessibility",
          severity: "warning",
          title: "Skipped heading level",
          description: `Heading levels should not skip (H${prev} followed by H${curr}). This confuses screen reader navigation.`,
          currentValue: `H${prev} → H${curr}`,
          recommendation: `Use H${prev + 1} instead of H${curr} to maintain a logical heading hierarchy.`,
        })
      );
      break;
    }
  }

  if ($("h1").length === 0 && headings.length > 0) {
    issues.push(
      createIssue({
        category: "accessibility",
        severity: "warning",
        title: "No H1 heading for page structure",
        description:
          "Screen reader users often navigate by headings. An H1 provides the main landmark for the page.",
        recommendation: "Add an H1 as the first and primary heading on the page.",
        fixSnippet: "<h1>Main Page Heading</h1>",
      })
    );
  }

  return issues;
}
