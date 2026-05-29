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
          paddingLeft: "80px",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: "28px",
            color: "#67e8f9",
          }}
        >
          CREATOR NEXUS
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "30px",
            fontSize: "82px",
            fontWeight: 900,
          }}
        >
          {data?.nickname || "Creator Nexus"}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "18px",
            fontSize: "36px",
            color: "#cffafe",
          }}
        >
          {data?.title || "Digital Creator"}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "18px",
            fontSize: "30px",
            color: "#94a3b8",
          }}
        >
          @{data?.username || username}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "36px",
            fontSize: "26px",
            color: "#ffffff",
          }}
        >
          {data?.category || "Creator"}
        </div>

        {data?.is_verified && (
          <div
            style={{
              display: "flex",
              marginTop: "24px",
              fontSize: "24px",
              color: "#fef9c3",
            }}
          >
            Verified
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}