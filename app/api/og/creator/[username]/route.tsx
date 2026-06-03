import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const SITE_NAME = "Cardpoc";
const DEFAULT_CREATOR_NAME = "Cardpoc Creator";
const DEFAULT_CREATOR_TITLE = "Digital Creator";
const DEFAULT_CREATOR_CATEGORY = "Creator";
const VERIFIED_LABEL = "Verified";
const BRAND_TAGLINE = "Collectible creator reputation cards.";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function normalizeUsername(value: string) {
  return decodeURIComponent(value).replace("@", "").trim();
}

function getInitials(value: string) {
  const cleanValue = value.trim();

  if (!cleanValue) {
    return "CP";
  }

  const parts = cleanValue
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }

  return cleanValue.slice(0, 2).toUpperCase();
}

export async function GET(
  request: Request,
  context: { params: Promise<{ username: string }> }
) {
  const params = await context.params;
  const username = normalizeUsername(params.username);

  const { data } = await supabase
    .from("creator_profiles")
    .select("nickname, username, title, category, is_verified, avatar_url")
    .ilike("username", username)
    .maybeSingle();

  const nickname = data?.nickname?.trim() || data?.username?.trim() || username || DEFAULT_CREATOR_NAME;
  const creatorUsername = data?.username?.trim() || username;
  const title = data?.title?.trim() || DEFAULT_CREATOR_TITLE;
  const category = data?.category?.trim() || DEFAULT_CREATOR_CATEGORY;
  const initials = getInitials(nickname);

  const origin = new URL(request.url).origin;
  const encodedCreatorUsername = encodeURIComponent(creatorUsername);
  const avatarProxyUrl = `${origin}/api/og/avatar/${encodedCreatorUsername}`;

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
            boxShadow: "0 0 90px rgba(34,211,238,0.18)",
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
              overflow: "hidden",
              boxShadow: "0 0 56px rgba(34,211,238,0.24)",
            }}
          >
            {data?.avatar_url ? (
              <img
                src={avatarProxyUrl}
                width={300}
                height={420}
                style={{
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  fontSize: "92px",
                  fontWeight: 900,
                  color: "#cffafe",
                  textShadow: "0 0 28px rgba(34,211,238,0.65)",
                }}
              >
                {initials}
              </div>
            )}
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
                fontWeight: 800,
              }}
            >
              {SITE_NAME.toUpperCase()}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: "28px",
                fontSize: nickname.length > 18 ? "62px" : "82px",
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: "-3px",
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
                  {VERIFIED_LABEL}
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
              {BRAND_TAGLINE}
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
