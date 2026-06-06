import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type CandidateDrop = {
  id: string;
  current_claims: number | null;
  max_claims: number | null;
  ends_at: string | null;
  created_at?: string | null;
};

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
    const nowIso = new Date().toISOString();

    const { data: drops, error } = await supabaseAdmin
      .from("creator_drops")
      .select("id, current_claims, max_claims, ends_at, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Auto draw lookup error:", error);

      return NextResponse.json(
        { error: "drop_lookup_failed", details: error.message },
        { status: 500 },
      );
    }

    const candidateDrops = ((drops || []) as CandidateDrop[]).filter((drop) => {
      const hasEnded = Boolean(drop.ends_at) && String(drop.ends_at) <= nowIso;
      const hasSlots =
        Number(drop.current_claims || 0) < Number(drop.max_claims || 0);

      return hasEnded && hasSlots;
    });

    const processed: Array<{
      dropId: string;
      ok: boolean;
      status?: number;
      entriesCount?: number;
      response?: unknown;
    }> = [];

    const skipped: Array<{
      dropId: string;
      reason: string;
      endsAt?: string | null;
      currentClaims?: number | null;
      maxClaims?: number | null;
      entriesCount?: number | null;
    }> = [];

    for (const drop of candidateDrops) {
      const { count: entriesCount, error: entriesError } = await supabaseAdmin
        .from("drop_entries")
        .select("id", { count: "exact", head: true })
        .eq("drop_id", drop.id);

      if (entriesError) {
        console.error("Auto draw entries count error:", entriesError);

        skipped.push({
          dropId: drop.id,
          reason: "entries_count_failed",
          entriesCount: null,
        });

        continue;
      }

      if (!entriesCount || entriesCount <= 0) {
        skipped.push({
          dropId: drop.id,
          reason: "no_entries",
          entriesCount: entriesCount || 0,
        });

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
        entriesCount,
        response: payload,
      });
    }

    return NextResponse.json({
      ok: true,
      now: nowIso,
      scanned: drops?.length || 0,
      candidates: candidateDrops.length,
      count: processed.length,
      processed,
      skipped,
    });
  } catch (error) {
    console.error("Auto draw unexpected error:", error);

    return NextResponse.json(
      { error: "unexpected_error" },
      { status: 500 },
    );
  }
}