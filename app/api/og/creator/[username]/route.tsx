import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function OgImage({ text }: { text: string }) {
  return (
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
      {text}
    </div>
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const params = await context.params;
    const username = params.username;

    const { data, error } = await supabase
      .from("creator_profiles")
      .select("nickname")
      .ilike("username", username)
      .maybeSingle();

    if (error) {
      return new ImageResponse(<OgImage text={`Erro: ${error.message}`} />, {
        width: 1200,
        height: 630,
      });
    }

    return new ImageResponse(
      <OgImage text={data?.nickname || `Não achou: ${username}`} />,
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error: any) {
    return new ImageResponse(<OgImage text={`Catch: ${error.message}`} />, {
      width: 1200,
      height: 630,
    });
  }
}