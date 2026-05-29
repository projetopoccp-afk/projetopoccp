import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function OgCard({
  nickname,
  username,
  title,
  category,
}: {
  nickname: string;
  username: string;
  title: string;
  category: string;
}) {
  return (
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
          fontSize: "28px",
          color: "#67e8f9",
        }}
      >
        CREATOR NEXUS
      </div>

      <div
        style={{
          marginTop: "30px",
          fontSize: "82px",
          fontWeight: 900,
        }}
      >
        {nickname}
      </div>

      <div
        style={{
          marginTop: "18px",
          fontSize: "36px",
          color: "#cffafe",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: "18px",
          fontSize: "30px",
          color: "#94a3b8",
        }}
      >
        @{username}
      </div>

      <div
        style={{
          marginTop: "36px",
          fontSize: "26px",
          color: "#ffffff",
        }}
      >
        {category}
      </div>
    </div>
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ username: string }> }
) {
  const params = await context.params;
  const username = decodeURIComponent(params.username).replace("@", "").trim();

  const { data } = await supabase
    .from("creator_profiles")
    .select("nickname, username, title, category")
    .ilike("username", username)
    .maybeSingle();

  return new ImageResponse(
    (
      <OgCard
        nickname={data?.nickname || "Creator Nexus"}
        username={data?.username || username}
        title={data?.title || "Digital Creator"}
        category={data?.category || "Creator"}
      />
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}