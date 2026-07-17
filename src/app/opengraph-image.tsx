import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(155deg, #05090f 0%, #0d1726 50%, #0e8f86 140%)",
          color: "white",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          padding: 48,
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 700, marginBottom: 16, letterSpacing: "-0.03em" }}>
          SEOHub
        </div>
        <div style={{ fontSize: 28, opacity: 0.72, textAlign: "center", maxWidth: 800 }}>
          Full-site SEO, without the SaaS tax.
        </div>
      </div>
    ),
    { ...size }
  );
}
