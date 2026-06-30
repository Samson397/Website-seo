import * as cheerio from "cheerio";
import { AuditContext, AuditIssue, createIssue } from "@/lib/types";

const MIN_WORD_COUNT = 300;

function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

function stripHtml(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  return $.text().replace(/\s+/g, " ").trim();
}

export function runContentAudit(ctx: AuditContext): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const text = stripHtml(ctx.fetchResult.html);
  const wordCount = countWords(text);

  if (wordCount < MIN_WORD_COUNT) {
    issues.push(
      createIssue({
        category: "seo",
        severity: wordCount < 100 ? "critical" : "warning",
        title: "Thin content detected",
        description:
          "Pages with very little text may be seen as low-quality by search engines and rank poorly.",
        currentValue: `${wordCount} words (recommended: ${MIN_WORD_COUNT}+)`,
        recommendation:
          "Add valuable, original content that thoroughly covers the page topic.",
      })
    );
  }

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  if (sentences.length > 0) {
    const avgWords =
      sentences.reduce((sum, s) => sum + countWords(s), 0) / sentences.length;
    if (avgWords > 30) {
      issues.push(
        createIssue({
          category: "seo",
          severity: "info",
          title: "Content may be hard to read",
          description:
            "Long sentences reduce readability. Aim for 15–20 words per sentence for general audiences.",
          currentValue: `Average ${Math.round(avgWords)} words per sentence`,
          recommendation:
            "Break long sentences into shorter ones. Use bullet points and subheadings.",
        })
      );
    }
  }

  const $ = cheerio.load(ctx.fetchResult.html);
  const hasArticleSchema = $('script[type="application/ld+json"]')
    .text()
    .includes("Article");
  const hasDateMeta =
    $('meta[property="article:published_time"]').length > 0 ||
    $("time[datetime]").length > 0;

  if (wordCount > 500 && !hasArticleSchema && !hasDateMeta) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "No content freshness signals",
        description:
          "Articles without publish dates or Article schema miss freshness signals that can help rankings.",
        recommendation:
          "Add article:published_time meta tag or datePublished in JSON-LD schema.",
        fixSnippet: `<meta property="article:published_time" content="${new Date().toISOString()}">`,
      })
    );
  }

  return issues;
}

export function extractPageMeta(ctx: AuditContext): {
  title: string;
  description: string;
} {
  const $ = cheerio.load(ctx.fetchResult.html);
  const title = $("title").first().text().trim() || "Untitled Page";
  const description =
    $('meta[name="description"]').attr("content")?.trim() ||
    $("p").first().text().trim().substring(0, 160) ||
    "No description available for this page.";
  return { title, description };
}
