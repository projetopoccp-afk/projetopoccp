import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      disabled: true,
      message:
        "Kick followers cache is disabled because the browser/goals flow produced unreliable follower and live data.",
    },
    { status: 410 },
  );
}

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      disabled: true,
      message:
        "Kick followers cache is disabled and no longer writes to Supabase.",
    },
    { status: 410 },
  );
}
