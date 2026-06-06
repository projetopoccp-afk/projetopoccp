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

export async function GET(request: Request) {
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const origin = new URL(request.url).origin;

    const { data: candidateDrops, error } = await supabaseAdmin
      .from("creator_drops")
      .select("id, current_claims, max_claims, ends_at")
      .lte("ends_at", new Date().toISOString())
      .lt("current_claims", "max_claims")
      .order("ends_at", { ascending: true })
      .limit(20);

    if (error) {
      console.error("Auto draw lookup error:", error);

      return NextResponse.json(
        { error: "drop_lookup_failed" },
        { status: 500 },
      );
    }

    const processed: Array<{
      dropId: string;
      ok: boolean;
      status?: number;
      response?: unknown;
    }> = [];

    for (const drop of candidateDrops || []) {
      try {
        const { count: entriesCount, error: entriesError } = await supabaseAdmin
          .from("drop_entries")
          .select("id", { count: "exact", head: true })
          .eq("drop_id", drop.id);

        if (entriesError) {
          console.error("Auto draw entries count error:", entriesError);
          continue;
        }

        if (!entriesCount || entriesCount <= 0) {
          continue;
        }

        const response = await fetch(`${origin}/api/drops/draw`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dropId: drop.id,
          }),
        });

        const text = await response.text();

        let payload: unknown = text;

        try {
          payload = JSON.parse(text);
        } catch {
          // mantém texto bruto
        }

        processed.push({
          dropId: drop.id,
          ok: response.ok,
          status: response.status,
          response: payload,
        });
      } catch (drawError) {
        console.error(`Auto draw failed for drop ${drop.id}`, drawError);

        processed.push({
          dropId: drop.id,
          ok: false,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      count: processed.length,
      processed,
    });
  } catch (error) {
    console.error("Auto draw unexpected error:", error);

    return NextResponse.json(
      { error: "unexpected_error" },
      { status: 500 },
    );
  }
}