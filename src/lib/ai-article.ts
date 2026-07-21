import { deepSeekChat, isDeepSeekConfigured } from "@/lib/deepseek";
import { classifyIntent, keywordRecommendation } from "@/lib/keyword-intelligence";

export type ArticleDraft = {
  keyword: string;
  intent: string;
  recommendation: string;
  seoTitle: string;
  metaDescription: string;
  outline: string[];
  article: string;
  faqs: Array<{ question: string; answer: string }>;
  schemaJsonLd: string;
  internalLinkIdeas: string[];
  source: "deepseek" | "template";
};

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : text.trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("No JSON object in model response");
  return JSON.parse(raw.slice(start, end + 1));
}

function templateDraft(keyword: string, siteUrl?: string): ArticleDraft {
  const intent = classifyIntent(keyword);
  const title = keyword
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const outline = [
    `What is ${keyword}?`,
    `Why ${keyword} matters`,
    `How to choose the right approach`,
    `Step-by-step guide`,
    `Common mistakes to avoid`,
    `FAQs`,
  ];
  const article = [
    `# ${title}`,
    "",
    `Looking for **${keyword}**? This guide covers what matters, how to evaluate options, and practical next steps.`,
    "",
    `## What is ${keyword}?`,
    `${keyword} is a search topic with clear commercial or informational intent. Start by defining the reader's goal and the outcome they want.`,
    "",
    `## Why ${keyword} matters`,
    "People compare options before they convert. Clear structure, proof, and FAQs help you win both rankings and trust.",
    "",
    "## How to choose the right approach",
    "1. Clarify the audience and location (if local).",
    "2. Map competitor pages ranking for the phrase.",
    "3. Cover missing subtopics and objections.",
    "4. Add internal links to related service or guide pages.",
    "",
    "## Step-by-step guide",
    "Draft the page around search intent, add unique examples, and include a clear call to action.",
    "",
    "## Common mistakes to avoid",
    "Thin copy, duplicate titles, and no internal links are the fastest ways to stall rankings.",
  ].join("\n");

  const faqs = [
    {
      question: `What should a ${keyword} page include?`,
      answer: "A clear promise, proof, process, FAQs, and a next step that matches search intent.",
    },
    {
      question: `How long should ${keyword} content be?`,
      answer: "Long enough to answer the query better than competitors — usually 800–1,500+ words for guides.",
    },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: `Practical guide to ${keyword}.`,
    mainEntityOfPage: siteUrl || undefined,
  };

  return {
    keyword,
    intent,
    recommendation: keywordRecommendation(keyword, intent),
    seoTitle: `${title} | Practical Guide`,
    metaDescription: `Learn ${keyword}: what it is, how to choose, and the steps that matter. Clear guidance without the fluff.`,
    outline,
    article,
    faqs,
    schemaJsonLd: JSON.stringify(schema, null, 2),
    internalLinkIdeas: [
      "Link from homepage / services hub to this article",
      "Add related blog posts in a 'Keep reading' section",
      "Link to contact / pricing if intent is commercial",
    ],
    source: "template",
  };
}

export async function generateArticleDraft(input: {
  keyword: string;
  siteUrl?: string;
  notes?: string;
}): Promise<ArticleDraft> {
  const keyword = input.keyword.trim();
  if (!keyword) throw new Error("Keyword is required");

  if (!isDeepSeekConfigured()) {
    return templateDraft(keyword, input.siteUrl);
  }

  const intent = classifyIntent(keyword);
  const prompt = `You are an SEO content strategist. Return ONLY valid JSON with keys:
seoTitle, metaDescription, outline (string[]), article (markdown string), faqs ({question,answer}[]), schemaJsonLd (stringified JSON-LD Article+FAQPage if useful), internalLinkIdeas (string[]).

Keyword: ${keyword}
Intent guess: ${intent}
Site: ${input.siteUrl || "n/a"}
Notes: ${input.notes || "n/a"}

Write original, practical content. No fluff. UK/US neutral English.`;

  try {
    const text = await deepSeekChat(
      [
        { role: "system", content: "Return JSON only. No markdown fences unless necessary." },
        { role: "user", content: prompt },
      ],
      { temperature: 0.4, maxTokens: 2500 }
    );
    const parsed = extractJson(text) as Partial<ArticleDraft>;
    return {
      keyword,
      intent,
      recommendation: keywordRecommendation(keyword, intent),
      seoTitle: String(parsed.seoTitle || `${keyword} guide`),
      metaDescription: String(parsed.metaDescription || ""),
      outline: Array.isArray(parsed.outline) ? parsed.outline.map(String) : [],
      article: String(parsed.article || ""),
      faqs: Array.isArray(parsed.faqs)
        ? parsed.faqs.map((f) => ({
            question: String((f as { question?: string }).question || ""),
            answer: String((f as { answer?: string }).answer || ""),
          }))
        : [],
      schemaJsonLd: String(parsed.schemaJsonLd || "{}"),
      internalLinkIdeas: Array.isArray(parsed.internalLinkIdeas)
        ? parsed.internalLinkIdeas.map(String)
        : [],
      source: "deepseek",
    };
  } catch {
    return templateDraft(keyword, input.siteUrl);
  }
}
