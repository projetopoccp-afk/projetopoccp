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

  const { data: creator } = await supabase
    .from("creator_profiles")
    .select("nickname, username, title, category, avatar_url, is_verified")
    .ilike("username", username)
    .maybeSingle();

  if (!creator) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#020617",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 64,
            fontWeight: 900,
          }}
        >
          Creator Nexus
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(circle at top left, #22d3ee55, transparent 35%), radial-gradient(circle at bottom right, #a855f755, transparent 35%), #020617",
          color: "white",
          display: "flex",
          padding: 64,
          gap: 48,
          alignItems: "center",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            width: 360,
            height: 460,
            borderRadius: 36,
            overflow: "hidden",
            border: "2px solid rgba(255,255,255,0.18)",
            background: "#000",
            display: "flex",
          }}
        >
          {creator.avatar_url ? (
            <img
              src={creator.avatar_url}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              color: "#67e8f9",
              fontSize: 26,
              letterSpacing: 8,
              textTransform: "uppercase",
            }}
          >
            Creator Nexus
          </div>

          <div
            style={{
              marginTop: 24,
              fontSize: 82,
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            {creator.nickname}
          </div>

          <div
            style={{
              marginTop: 18,
              fontSize: 34,
              color: "#cffafe",
            }}
          >
            {creator.title || "Digital Creator"}
          </div>

          <div
            style={{
              marginTop: 22,
              fontSize: 30,
              color: "rgba(255,255,255,0.65)",
            }}
          >
            @{creator.username}
          </div>

          <div style={{ marginTop: 40, display: "flex", gap: 16 }}>
            <div
              style={{
                padding: "14px 24px",
                borderRadius: 999,
                background: "rgba(34,211,238,0.14)",
                border: "1px solid rgba(34,211,238,0.35)",
                color: "#cffafe",
                fontSize: 24,
              }}
            >
              {creator.category || "Creator"}
            </div>

            {creator.is_verified && (
              <div
                style={{
                  padding: "14px 24px",
                  borderRadius: 999,
                  background: "rgba(250,204,21,0.14)",
                  border: "1px solid rgba(250,204,21,0.35)",
                  color: "#fef9c3",
                  fontSize: 24,
                }}
              >
                Verified
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}