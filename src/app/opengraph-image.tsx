import { ImageResponse } from "next/og";

export const alt = "Prompt Studio — AI Photo & Video Prompts";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Branded default OG image (applies site-wide unless a page overrides it). */
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0A0E14 0%, #141A24 55%, #0A0E14 100%)",
          color: "#F5F7FA",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 30 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "linear-gradient(120deg, #22D3EE, #3B82F6)",
            }}
          />
          <div style={{ fontSize: 36, fontWeight: 600 }}>Prompt Studio</div>
        </div>
        <div style={{ fontSize: 80, fontWeight: 700, lineHeight: 1.05 }}>
          Prompt the impossible.
        </div>
        <div style={{ fontSize: 34, color: "#AAB4C4", marginTop: 30, maxWidth: 880 }}>
          Thousands of cinematic AI photo and video prompts, filters, and tools.
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 46 }}>
          {["No ads", "AI generation", "Exclusive content"].map((t) => (
            <div
              key={t}
              style={{
                fontSize: 24,
                color: "#E8B765",
                border: "1px solid #5b4a2a",
                borderRadius: 999,
                padding: "8px 22px",
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
