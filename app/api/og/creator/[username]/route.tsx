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
    .select("nickname, username, title, category, avatar_url, is_verified")
    .ilike("username", cleanUsername)
    .maybeSingle();

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background:
            "linear-gradient(135deg, #020617 0%, #0f172a 45%, #111827 100%)",
          color: "white",
          display: "flex",
          padding: "64px",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            border: "2px solid rgba(255,255,255,0.16)",
            borderRadius: "40px",
            padding: "44px",
            background:
              "radial-gradient(circle at top left, rgba(34,211,238,0.28), transparent 35%), radial-gradient(circle at bottom right, rgba(168,85,247,0.28), transparent 35%)",
          }}
        >
          <div
            style={{
              width: "300px",
              height: "420px",
              borderRadius: "32px",
              overflow: "hidden",
              background: "#000",
              border: "2px solid rgba(255,255,255,0.18)",
              display: "flex",
            }}
          >
            {creator?.avatar_url ? (
              <img
                src={creator.avatar_url}
                width="300"
                height="420"
                style={{
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "300px",
                  height: "420px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "80px",
                  fontWeight: 900,
                }}
              >
                CN
              </div>
            )}
          </div>

          <div
            style={{
              marginLeft: "56px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: 1,
            }}
          >
            <div
              style={{
                color: "#67e8f9",
                fontSize: "28px",
                letterSpacing: "8px",
                textTransform: "uppercase",
                marginBottom: "28px",
              }}
            >
              Creator Nexus
            </div>

            <div
              style={{
                fontSize: "82px",
                lineHeight: 1,
                fontWeight: 900,
              }}
            >
              {creator?.nickname || "Creator Nexus"}
            </div>

            <div
              style={{
                marginTop: "20px",
                fontSize: "36px",
                color: "#cffafe",
                fontWeight: 700,
              }}
            >
              {creator?.title || "Digital Creator"}
            </div>

            <div
              style={{
                marginTop: "20px",
                fontSize: "30px",
                color: "rgba(255,255,255,0.65)",
              }}
            >
              @{creator?.username || cleanUsername}
            </div>

            <div
              style={{
                display: "flex",
                gap: "16px",
                marginTop: "42px",
              }}
            >
              <div
                style={{
                  padding: "14px 24px",
                  borderRadius: "999px",
                  background: "rgba(34,211,238,0.16)",
                  border: "1px solid rgba(34,211,238,0.38)",
                  color: "#cffafe",
                  fontSize: "24px",
                }}
              >
                {creator?.category || "Creator"}
              </div>

              {creator?.is_verified && (
                <div
                  style={{
                    padding: "14px 24px",
                    borderRadius: "999px",
                    background: "rgba(250,204,21,0.16)",
                    border: "1px solid rgba(250,204,21,0.38)",
                    color: "#fef9c3",
                    fontSize: "24px",
                  }}
                >
                  Verified
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}