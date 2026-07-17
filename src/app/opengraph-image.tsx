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
          background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
          padding: 48,
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 700, marginBottom: 16 }}>
          SEOHub
        </div>
        <div style={{ fontSize: 28, opacity: 0.9, textAlign: "center", maxWidth: 800 }}>
          What your site has &amp; what&apos;s missing
        </div>
      </div>
    ),
    { ...size }
  );
}
