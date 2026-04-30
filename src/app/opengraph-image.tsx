import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Olive Linen — premium linen hire, Queenstown";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default Open Graph image for the site.
 * Renders edge-side from JSX — no static asset required.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f6f1e6",
          display: "flex",
          flexDirection: "column",
          padding: "80px",
          color: "#1d2616",
          position: "relative",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#677b4d",
          }}
        >
          Olive Linen — Queenstown, NZ
        </div>

        <div
          style={{
            fontSize: 138,
            lineHeight: 1.0,
            letterSpacing: "-0.03em",
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Like the olive</span>
          <span style={{ fontStyle: "italic", fontWeight: 300, color: "#c8541c" }}>
            to your martini.
          </span>
        </div>

        <div
          style={{
            fontSize: 24,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#3d4b2d",
            marginTop: 30,
          }}
        >
          Premium linen hire · Weddings · Hospitality · Events
        </div>

        {/* Brand mark — top right */}
        <div
          style={{
            position: "absolute",
            top: 80,
            right: 80,
            fontSize: 56,
            fontStyle: "italic",
            color: "#c8541c",
            display: "flex",
          }}
        >
          OLIV<span style={{ color: "#c8541c" }}>e</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
