import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  processDropDraw,
} from "../../../../lib/drops/processDropDraw";

type DropEntryRow = {
  drop_id: string;
};

type DropRow = {
  id: string;
  is_active: boolean | null;
  current_claims: number | null;
  max_claims: number | null;
  ends_at: string | null;
  created_at: string | null;
};

function hasDropEnded(endsAt: string | null) {
  if (!endsAt) return false;

  const endsAtTime = new Date(endsAt).getTime();

  if (Number.isNaN(endsAtTime)) return false;

  return endsAtTime <= Date.now();
}

export async function GET() {
  try {
    const supabaseAdmin = createSupabaseAdminClient();
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
        trackedDrops: 0,
        candidates: 0,
        count: 0,
        processed: [],
        skipped: [],
      });
    }

    const { data: drops, error: dropsError } = await supabaseAdmin
      .from("creator_drops")
      .select("id, is_active, current_claims, max_claims, ends_at, created_at")
      .in("id", dropIds);

    if (dropsError) {
      console.error("Auto draw drops lookup error:", dropsError);

      return NextResponse.json(
        { error: "drops_lookup_failed", details: dropsError.message },
        { status: 500 },
      );
    }

    const processed: Array<{
      dropId: string;
      ok: boolean;
      status?: number;
      entriesCount?: number;
      claimsCount?: number;
      response?: unknown;
    }> = [];

    const skipped: Array<{
      dropId: string;
      reason: string;
      isActive?: boolean | null;
      endsAt?: string | null;
      currentClaims?: number | null;
      maxClaims?: number | null;
      entriesCount?: number | null;
      claimsCount?: number | null;
    }> = [];

    for (const drop of (drops || []) as DropRow[]) {
      const { count: entriesCount, error: entriesCountError } =
        await supabaseAdmin
          .from("drop_entries")
          .select("id", { count: "exact", head: true })
          .eq("drop_id", drop.id);

      if (entriesCountError) {
        console.error("Auto draw entries count error:", entriesCountError);

        skipped.push({
          dropId: drop.id,
          reason: "entries_count_failed",
          isActive: drop.is_active,
          endsAt: drop.ends_at,
          currentClaims: drop.current_claims,
          maxClaims: drop.max_claims,
          entriesCount: null,
          claimsCount: null,
        });

        continue;
      }

      const { count: claimsCount, error: claimsCountError } =
        await supabaseAdmin
          .from("drop_claims")
          .select("id", { count: "exact", head: true })
          .eq("drop_id", drop.id);

      if (claimsCountError) {
        console.error("Auto draw claims count error:", claimsCountError);

        skipped.push({
          dropId: drop.id,
          reason: "claims_count_failed",
          isActive: drop.is_active,
          endsAt: drop.ends_at,
          currentClaims: drop.current_claims,
          maxClaims: drop.max_claims,
          entriesCount: entriesCount || 0,
          claimsCount: null,
        });

        continue;
      }

      const safeEntriesCount = Number(entriesCount || 0);
      const safeClaimsCount = Number(claimsCount || 0);
      const safeMaxClaims = Number(drop.max_claims || 0);

      if (safeEntriesCount <= 0) {
        skipped.push({
          dropId: drop.id,
          reason: "no_entries",
          isActive: drop.is_active,
          endsAt: drop.ends_at,
          currentClaims: drop.current_claims,
          maxClaims: drop.max_claims,
          entriesCount: safeEntriesCount,
          claimsCount: safeClaimsCount,
        });

        continue;
      }

      if (!hasDropEnded(drop.ends_at)) {
        skipped.push({
          dropId: drop.id,
          reason: "not_ended_yet",
          isActive: drop.is_active,
          endsAt: drop.ends_at,
          currentClaims: drop.current_claims,
          maxClaims: drop.max_claims,
          entriesCount: safeEntriesCount,
          claimsCount: safeClaimsCount,
        });

        continue;
      }

      if (safeMaxClaims <= 0) {
        skipped.push({
          dropId: drop.id,
          reason: "invalid_max_claims",
          isActive: drop.is_active,
          endsAt: drop.ends_at,
          currentClaims: drop.current_claims,
          maxClaims: drop.max_claims,
          entriesCount: safeEntriesCount,
          claimsCount: safeClaimsCount,
        });

        continue;
      }

      if (safeClaimsCount >= safeMaxClaims) {
        skipped.push({
          dropId: drop.id,
          reason: "already_full",
          isActive: drop.is_active,
          endsAt: drop.ends_at,
          currentClaims: drop.current_claims,
          maxClaims: drop.max_claims,
          entriesCount: safeEntriesCount,
          claimsCount: safeClaimsCount,
        });

        continue;
      }

      const result = await processDropDraw(drop.id, supabaseAdmin);

      processed.push({
        dropId: drop.id,
        ok: result.ok,
        status: result.status,
        entriesCount: safeEntriesCount,
        claimsCount: safeClaimsCount,
        response: result.ok ? result : { error: result.error },
      });
    }

    return NextResponse.json({
      ok: true,
      now: nowIso,
      scannedEntries: entryRows?.length || 0,
      trackedDrops: dropIds.length,
      candidates: processed.length,
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
