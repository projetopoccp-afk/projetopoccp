import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#020617",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "72px",
          fontWeight: 900,
          fontFamily: "Arial",
        }}
      >
        Creator Nexus
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}