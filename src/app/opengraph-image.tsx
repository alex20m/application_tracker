import { ImageResponse } from "next/og";

export const alt = "AppTrack";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TEAL = "#2a9e94";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(160deg, #1f7a72 0%, #0f3d44 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
        }}
      >
        {/* Brand mark */}
        <svg width="160" height="160" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill={TEAL} />
          <rect x="0" y="0" width="32" height="14" rx="8" fill="white" fillOpacity="0.07" />
          <path d="M7 23 C12 23 12 15 16 15 C20 15 20 9 25 9" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" strokeOpacity="0.8" />
          <circle cx="7" cy="23" r="2.5" fill={TEAL} stroke="white" strokeWidth="2" strokeOpacity="0.6" />
          <circle cx="16" cy="15" r="2.5" fill={TEAL} stroke="white" strokeWidth="2" strokeOpacity="0.9" />
          <circle cx="16" cy="15" r="1.1" fill="white" fillOpacity="0.65" />
          <circle cx="25" cy="9" r="3.5" fill="white" />
          <circle cx="25" cy="9" r="1.7" fill={TEAL} />
        </svg>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 72, fontWeight: 700, color: "#ffffff", letterSpacing: -2 }}>
            AppTrack
          </span>
          <span style={{ fontSize: 32, color: "rgba(255,255,255,0.65)" }}>
            Track your job applications in one place
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
