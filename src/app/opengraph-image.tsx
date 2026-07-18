import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logoData = await readFile(join(process.cwd(), "public/logo.png"));
  const logoSrc = Uint8Array.from(logoData).buffer;

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
          background: "linear-gradient(145deg, #0b1f3a 0%, #123a6b 45%, #0d9488 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
          padding: 48,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc as unknown as string} width={280} height={312} alt="SEOHub" />
        <div
          style={{
            fontSize: 28,
            opacity: 0.92,
            textAlign: "center",
            maxWidth: 800,
            marginTop: 28,
          }}
        >
          Full-site SEO audits — free to start, no account
        </div>
      </div>
    ),
    { ...size }
  );
}
