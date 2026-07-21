import { dataForSeoAuthHeader, getDataForSeoCredentials } from "@/lib/dataforseo";

export type RenderedPage = {
  url: string;
  finalUrl: string;
  statusCode: number;
  html: string;
  rendered: boolean;
  source: "dataforseo" | "none";
  error?: string;
};

/**
 * Optional JS-rendered HTML via DataForSEO Instant Pages.
 * Use when public fetch misses client-rendered content.
 */
export async function fetchRenderedHtml(url: string): Promise<RenderedPage> {
  const creds = getDataForSeoCredentials();
  if (!creds) {
    return {
      url,
      finalUrl: url,
      statusCode: 0,
      html: "",
      rendered: false,
      source: "none",
      error: "DataForSEO not configured for JS rendering",
    };
  }

  try {
    const res = await fetch("https://api.dataforseo.com/v3/on_page/instant_pages", {
      method: "POST",
      headers: {
        Authorization: dataForSeoAuthHeader(creds),
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          url,
          enable_javascript: true,
          enable_browser_rendering: true,
          load_resources: true,
          custom_user_agent:
            "Mozilla/5.0 (compatible; SEOHub/1.0; +https://www.seohub.online)",
        },
      ]),
      signal: AbortSignal.timeout(90000),
    });

    if (!res.ok) {
      return {
        url,
        finalUrl: url,
        statusCode: res.status,
        html: "",
        rendered: false,
        source: "dataforseo",
        error: `Instant pages HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    const item = data.tasks?.[0]?.result?.[0]?.items?.[0] as
      | {
          url?: string;
          status_code?: number;
          page_content?: string;
          meta?: { content?: { plain_text_word_count?: number } };
        }
      | undefined;

    // Some responses put HTML under different keys depending on plan
    const html =
      (item as { html?: string } | undefined)?.html ||
      (data.tasks?.[0]?.result?.[0] as { html?: string } | undefined)?.html ||
      "";

    if (!html) {
      // Fallback: if we at least got a content snapshot, wrap as minimal HTML for checkers
      const plain = item?.meta?.content?.plain_text_word_count;
      return {
        url,
        finalUrl: item?.url || url,
        statusCode: item?.status_code || 0,
        html: "",
        rendered: false,
        source: "dataforseo",
        error: plain
          ? "JS render returned metrics but no HTML body on this plan"
          : "JS render returned no HTML",
      };
    }

    return {
      url,
      finalUrl: item?.url || url,
      statusCode: item?.status_code || 200,
      html,
      rendered: true,
      source: "dataforseo",
    };
  } catch (e) {
    return {
      url,
      finalUrl: url,
      statusCode: 0,
      html: "",
      rendered: false,
      source: "dataforseo",
      error: e instanceof Error ? e.message : "JS render failed",
    };
  }
}
