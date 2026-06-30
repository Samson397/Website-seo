import * as cheerio from "cheerio";
import { AuditContext, AuditIssue, createIssue } from "@/lib/types";

export function runImageAudit(ctx: AuditContext): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const $ = cheerio.load(ctx.fetchResult.html);

  const images = $("img").toArray();
  const totalImages = images.length;

  if (totalImages === 0) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "No images on page",
        description:
          "Pages with relevant images can improve engagement and appear in Google Image search.",
        recommendation: "Add relevant, optimized images with descriptive alt text.",
      })
    );
    return issues;
  }

  let missingDimensions = 0;
  let missingLazy = 0;
  let legacyFormat = 0;

  images.forEach((el) => {
    const src = $(el).attr("src") || $(el).attr("data-src") || "";
    const width = $(el).attr("width");
    const height = $(el).attr("height");
    const loading = $(el).attr("loading");

    if (!width || !height) missingDimensions++;
    if (loading !== "lazy") missingLazy++;
    if (/\.(png|bmp|gif)(\?|$)/i.test(src) && !/\.svg/i.test(src)) legacyFormat++;
  });

  if (missingDimensions > 0) {
    issues.push(
      createIssue({
        category: "performance",
        severity: missingDimensions > totalImages / 2 ? "warning" : "info",
        title: "Images missing width/height attributes",
        description:
          "Images without explicit dimensions cause layout shift (CLS) while loading, hurting Core Web Vitals.",
        currentValue: `${missingDimensions} of ${totalImages} images`,
        recommendation:
          "Add width and height attributes matching each image's aspect ratio.",
        fixSnippet: `<img src="/image.jpg" width="800" height="600" alt="Description">`,
      })
    );
  }

  if (missingLazy > 1) {
    issues.push(
      createIssue({
        category: "performance",
        severity: "info",
        title: "Images not using lazy loading",
        description:
          "Lazy loading defers off-screen images, improving initial page load speed.",
        currentValue: `${missingLazy} of ${totalImages} images without loading="lazy"`,
        recommendation: 'Add loading="lazy" to images below the fold.',
        fixSnippet: `<img src="/image.jpg" loading="lazy" alt="Description">`,
      })
    );
  }

  if (legacyFormat > 0) {
    issues.push(
      createIssue({
        category: "performance",
        severity: "info",
        title: "Images could use modern formats",
        description:
          "WebP or AVIF formats are typically 25–50% smaller than PNG/GIF with similar quality.",
        currentValue: `${legacyFormat} PNG/GIF/BMP image(s) detected`,
        recommendation: "Convert to WebP and serve with a fallback for older browsers.",
      })
    );
  }

  return issues;
}
