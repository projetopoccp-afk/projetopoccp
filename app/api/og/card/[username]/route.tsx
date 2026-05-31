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
    .select("nickname, username, category, avatar_url")
    .ilike("username", username)
    .maybeSingle();

  const nickname = data?.nickname || "Creator Nexus";
  const creatorUsername = data?.username || username;
  const category = data?.category || "Creator";
  const initials = nickname.slice(0, 2).toUpperCase();

  const origin = new URL(request.url).origin;
  const avatarProxyUrl = `${origin}/api/og/avatar/${creatorUsername}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background:
            "radial-gradient(circle at top left, rgba(34,211,238,0.22), transparent 34%), radial-gradient(circle at bottom right, rgba(168,85,247,0.28), transparent 38%), #020617",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial",
          color: "white",
        }}
      >
        <div
          style={{
            width: "390px",
            height: "560px",
            borderRadius: "42px",
            border: "2px solid rgba(103,232,249,0.45)",
            background: "#020617",
            overflow: "hidden",
            position: "relative",
            boxShadow: "0 0 80px rgba(34,211,238,0.22)",
            display: "flex",
          }}
        >
          {data?.avatar_url ? (
            <img
              src={avatarProxyUrl}
              width={390}
              height={560}
              style={{
                objectFit: "cover",
                width: "390px",
                height: "560px",
              }}
            />
          ) : (
            <div
              style={{
                width: "390px",
                height: "560px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "96px",
                fontWeight: 900,
                color: "#cffafe",
                background:
                  "linear-gradient(160deg, rgba(34,211,238,0.22), rgba(168,85,247,0.18), rgba(0,0,0,0.9))",
              }}
            >
              {initials}
            </div>
          )}

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.25), transparent)",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: "28px",
              left: "28px",
              display: "flex",
              border: "1px solid rgba(103,232,249,0.45)",
              background: "rgba(8,47,73,0.72)",
              color: "#cffafe",
              borderRadius: "999px",
              padding: "8px 18px",
              fontSize: "18px",
              fontWeight: 900,
              letterSpacing: "6px",
            }}
          >
            COMMON
          </div>

          <div
            style={{
              position: "absolute",
              left: "32px",
              right: "32px",
              bottom: "34px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                color: "#cffafe",
                fontSize: "20px",
                fontWeight: 900,
                letterSpacing: "7px",
              }}
            >
              CARTA DO CREATOR
            </div>

            <div
              style={{
                display: "flex",
                marginTop: "16px",
                fontSize: "46px",
                lineHeight: 1,
                fontWeight: 900,
              }}
            >
              {nickname}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: "12px",
                fontSize: "24px",
                color: "#cbd5e1",
              }}
            >
              @{creatorUsername}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: "22px",
                fontSize: "20px",
                color: "#e0f2fe",
              }}
            >
              {category}
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