import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: Request,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;
  const cleanUsername = decodeURIComponent(username).replace("@", "").trim();

  const { data } = await supabase
    .from("creator_profiles")
    .select("avatar_url")
    .ilike("username", cleanUsername)
    .maybeSingle();

  if (!data?.avatar_url) {
    return new NextResponse(null, { status: 404 });
  }

  const response = await fetch(data.avatar_url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    return new NextResponse(null, { status: 404 });
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const buffer = await response.arrayBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}