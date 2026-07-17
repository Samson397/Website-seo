import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon — blue hexagon + white magnifier/arrow (matches brand mark). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <div
          style={{
            width: 148,
            height: 160,
            background: "#2563EB",
            clipPath: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              border: "10px solid white",
              borderRadius: 999,
              marginRight: 18,
              marginTop: 10,
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 54,
              height: 12,
              background: "white",
              transform: "rotate(-45deg)",
              top: 58,
              left: 78,
              borderRadius: 8,
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 0,
              height: 0,
              borderLeft: "12px solid transparent",
              borderRight: "12px solid transparent",
              borderBottom: "20px solid white",
              transform: "rotate(45deg)",
              top: 34,
              right: 28,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
