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
  try {
    const params = await context.params;
    const username = decodeURIComponent(params.username)
      .replace("@", "")
      .trim();

    const { data, error } = await supabase
      .from("creator_profiles")
      .select("nickname, username, title, category, is_verified")
      .ilike("username", username)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const nickname = data?.nickname || "Creator Nexus";
    const creatorUsername = data?.username || username;
    const title = data?.title || "Digital Creator";
    const category = data?.category || "Creator";

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
          <div
            style={{
              color: "#67e8f9",
              fontSize: "26px",
              letterSpacing: "8px",
              textTransform: "uppercase",
            }}
          >
            Creator Nexus
          </div>

          <div
            style={{
              marginTop: "34px",
              fontSize: "86px",
              lineHeight: 1,
              fontWeight: 900,
            }}
          >
            {nickname}
          </div>

          <div
            style={{
              marginTop: "18px",
              fontSize: "38px",
              color: "#cffafe",
              fontWeight: 700,
            }}
          >
            {title}
          </div>

          <div
            style={{
              marginTop: "20px",
              fontSize: "30px",
              color: "#94a3b8",
            }}
          >
            @{creatorUsername}
          </div>

          <div
            style={{
              marginTop: "44px",
              display: "flex",
              gap: "16px",
            }}
          >
            <div
              style={{
                padding: "14px 24px",
                borderRadius: "999px",
                background: "rgba(34,211,238,0.18)",
                color: "#cffafe",
                fontSize: "24px",
              }}
            >
              {category}
            </div>

            {data?.is_verified && (
              <div
                style={{
                  padding: "14px 24px",
                  borderRadius: "999px",
                  background: "rgba(250,204,21,0.18)",
                  color: "#fef9c3",
                  fontSize: "24px",
                }}
              >
                Verified
              </div>
            )}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch {
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
            fontSize: "64px",
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
}