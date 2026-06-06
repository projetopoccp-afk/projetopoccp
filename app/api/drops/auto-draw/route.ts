import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET() {
  try {
    const supabaseAdmin = createSupabaseAdminClient();

    const { data: expiredDrops, error } = await supabaseAdmin
      .from("creator_drops")
      .select("id")
      .eq("is_active", true)
      .lte("ends_at", new Date().toISOString());

    if (error) {
      console.error("Auto draw lookup error:", error);

      return NextResponse.json(
        { error: "drop_lookup_failed" },
        { status: 500 },
      );
    }

    const processed: string[] = [];

    for (const drop of expiredDrops || []) {
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL}/api/drops/draw`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              dropId: drop.id,
            }),
          },
        );

        processed.push(drop.id);
      } catch (drawError) {
        console.error(
          `Auto draw failed for drop ${drop.id}`,
          drawError,
        );
      }
    }

    return NextResponse.json({
      ok: true,
      processed,
      count: processed.length,
    });
  } catch (error) {
    console.error("Auto draw unexpected error:", error);

    return NextResponse.json(
      { error: "unexpected_error" },
      { status: 500 },
    );
  }
}