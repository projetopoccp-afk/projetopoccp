import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type DropEntryRow = {
  drop_id: string;
};

type DropRow = {
  id: string;
  current_claims: number | null;
  max_claims: number | null;
  ends_at: string | null;
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

    const { data: entryRows, error: entriesLookupError } = await supabaseAdmin
      .from("drop_entries")
      .select("drop_id")
      .order("entered_at", { ascending: false })
      .limit(500);

    if (entriesLookupError) {
      console.error("Auto draw entries lookup error:", entriesLookupError);

      return NextResponse.json(
        { error: "entries_lookup_failed", details: entriesLookupError.message },
        { status: 500 },
      );
    }

    const dropIds = Array.from(
      new Set(
        ((entryRows || []) as DropEntryRow[])
          .map((entry) => entry.drop_id)
          .filter(Boolean),
      ),
    );

    if (dropIds.length === 0) {
      return NextResponse.json({
        ok: true,
        now: nowIso,
        scannedEntries: 0,
        candidates: 0,
        count: 0,
        processed: [],
        skipped: [],
      });
    }

    const { data: drops, error: dropsError } = await supabaseAdmin
      .from("creator_drops")
      .select("id, current_claims, max_claims, ends_at")
      .in("id", dropIds);

    if (dropsError) {
      console.error("Auto draw drops lookup error:", dropsError);

      return NextResponse.json(
        { error: "drops_lookup_failed", details: dropsError.message },
        { status: 500 },
      );
    }

    const candidateDrops = ((drops || []) as DropRow[]).filter((drop) => {
      const hasEnded =
        Boolean(drop.ends_at) && new Date(String(drop.ends_at)).getTime() <= Date.now();

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
      entriesCount?: number | null;
    }> = [];

    for (const drop of candidateDrops) {
      const { count: entriesCount, error: entriesCountError } = await supabaseAdmin
        .from("drop_entries")
        .select("id", { count: "exact", head: true })
        .eq("drop_id", drop.id);

      if (entriesCountError) {
        console.error("Auto draw entries count error:", entriesCountError);

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
      scannedEntries: entryRows?.length || 0,
      trackedDrops: dropIds.length,
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