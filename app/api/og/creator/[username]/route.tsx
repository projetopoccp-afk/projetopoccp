import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: Request,
  context: { params: Promise<{ username: string }> }
) {
  const params = await context.params;
  const username = decodeURIComponent(params.username).replace("@", "").trim();

  const { data } = await supabase
    .from("creator_profiles")
    .select("nickname, username, title, category, is_verified")
    .ilike("username", username)
    .maybeSingle();

  const nickname = data?.nickname || "Creator Nexus";
  const creatorUsername = data?.username || username;
  const title = data?.title || "Digital Creator";
  const category = data?.category || "Creator";
  const initials = nickname.slice(0, 2).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background:
            "radial-gradient(circle at top left, rgba(34,211,238,0.32), transparent 34%), radial-gradient(circle at bottom right, rgba(168,85,247,0.30), transparent 38%), #020617",
          color: "white",
          display: "flex",
          alignItems: "center",
          padding: "56px",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            border: "2px solid rgba(255,255,255,0.14)",
            borderRadius: "42px",
            background: "rgba(255,255,255,0.045)",
            padding: "42px",
          }}
        >
          <div
            style={{
              width: "300px",
              height: "420px",
              borderRadius: "34px",
              border: "2px solid rgba(34,211,238,0.35)",
              background:
                "linear-gradient(160deg, rgba(34,211,238,0.22), rgba(168,85,247,0.18), rgba(0,0,0,0.9))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "92px",
              fontWeight: 900,
              color: "#cffafe",
            }}
          >
            {initials}
          </div>

          <div
            style={{
              flex: 1,
              marginLeft: "54px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                color: "#67e8f9",
                fontSize: "25px",
                letterSpacing: "8px",
                textTransform: "uppercase",
              }}
            >
              CREATOR NEXUS
            </div>

            <div
              style={{
                display: "flex",
                marginTop: "28px",
                fontSize: "82px",
                lineHeight: 1,
                fontWeight: 900,
              }}
            >
              {nickname}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: "18px",
                fontSize: "36px",
                color: "#cffafe",
                fontWeight: 700,
              }}
            >
              {title}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: "18px",
                fontSize: "30px",
                color: "#94a3b8",
              }}
            >
              @{creatorUsername}
            </div>

            <div
              style={{
                display: "flex",
                gap: "16px",
                marginTop: "40px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  padding: "14px 24px",
                  borderRadius: "999px",
                  background: "rgba(34,211,238,0.18)",
                  border: "1px solid rgba(34,211,238,0.38)",
                  color: "#cffafe",
                  fontSize: "24px",
                }}
              >
                {category}
              </div>

              {data?.is_verified && (
                <div
                  style={{
                    display: "flex",
                    padding: "14px 24px",
                    borderRadius: "999px",
                    background: "rgba(250,204,21,0.18)",
                    border: "1px solid rgba(250,204,21,0.38)",
                    color: "#fef9c3",
                    fontSize: "24px",
                  }}
                >
                  Verified
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: "42px",
                fontSize: "24px",
                color: "rgba(255,255,255,0.72)",
              }}
            >
              Discover legendary creators through living digital cards.
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