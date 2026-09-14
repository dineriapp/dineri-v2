import { ImageResponse } from "next/og";

import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const runtime = "nodejs";
export const alt = `${SITE_NAME} - ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: "#0b0d10",
        padding: 88,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -160,
          right: -120,
          width: 620,
          height: 620,
          borderRadius: 620,
          background: "rgba(198,242,78,0.14)",
        }}
      />
      <div
        style={{
          display: "flex",
          fontSize: 26,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: "#C6F24E",
        }}
      >
        {SITE_NAME}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 26,
          fontSize: 78,
          fontWeight: 700,
          color: "#ffffff",
          lineHeight: 1.05,
          letterSpacing: -2,
        }}
      >
        {SITE_TAGLINE}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 30,
          fontSize: 30,
          color: "#9aa0ac",
          lineHeight: 1.35,
          maxWidth: 900,
        }}
      >
        {SITE_DESCRIPTION}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 46,
          height: 6,
          width: 120,
          background: "#C6F24E",
        }}
      />
    </div>,
    size,
  );
}
