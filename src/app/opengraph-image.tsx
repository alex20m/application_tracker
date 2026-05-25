import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const alt = "AppTrack";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const iconData = await readFile(path.join(process.cwd(), "public/icon-512.png"));
  const iconSrc = `data:image/png;base64,${iconData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconSrc} width={160} height={160} style={{ borderRadius: 32 }} alt="" />
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
          <span style={{ fontSize: 32, color: "#c7d2fe" }}>
            Track your job applications in one place
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
