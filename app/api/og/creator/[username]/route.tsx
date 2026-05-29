import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const cleanUsername = decodeURIComponent(username).replace("@", "").trim();

  const { data: creator } = await supabase
    .from("creator_profiles")
    .select("nickname, username, title, category, is_verified")
    .ilike("username", cleanUsername)
    .maybeSingle();

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#020617",
          color: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "Arial",
        }}
      >
        <div style={{ color: "#67e8f9", fontSize: 28, letterSpacing: 8 }}>
          CREATOR NEXUS
        </div>

        <div style={{ marginTop: 32, fontSize: 86, fontWeight: 900 }}>
          {creator?.nickname || "Creator Nexus"}
        </div>

        <div style={{ marginTop: 18, fontSize: 38, color: "#cffafe" }}>
          {creator?.title || "Digital Creator"}
        </div>

        <div style={{ marginTop: 22, fontSize: 30, color: "#94a3b8" }}>
          @{creator?.username || cleanUsername}
        </div>

        <div style={{ marginTop: 42, display: "flex", gap: 16 }}>
          <div
            style={{
              padding: "14px 24px",
              borderRadius: 999,
              background: "rgba(34,211,238,0.18)",
              color: "#cffafe",
              fontSize: 24,
            }}
          >
            {creator?.category || "Creator"}
          </div>

          {creator?.is_verified && (
            <div
              style={{
                padding: "14px 24px",
                borderRadius: 999,
                background: "rgba(250,204,21,0.18)",
                color: "#fef9c3",
                fontSize: 24,
              }}
            >
              Verified
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}