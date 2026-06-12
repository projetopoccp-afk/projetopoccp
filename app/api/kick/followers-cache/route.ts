import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type CachePayload = {
  creatorId?: string | null;
  username?: string | null;
  followerCount?: number | string | null;
  source?: string | null;
};

function normalizeKickUsername(username: string) {
  const value = username.trim();

  if (!value) return "";

  try {
    const url = value.startsWith("http")
      ? new URL(value)
      : new URL(`https://${value}`);

    if (url.hostname.includes("kick.com")) {
      const slug = url.pathname.split("/").filter(Boolean)[0];
      return (slug || "").replace(/^@/, "").toLowerCase();
    }
  } catch {
    // Continua com normalização manual abaixo.
  }

  return value
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/^kick\.com\//i, "")
    .replace(/^@/, "")
    .split("?")[0]
    .split("#")[0]
    .split("/")[0]
    .trim()
    .toLowerCase();
}

function getSafeFollowerCount(value: unknown) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return undefined;

  const normalizedValue = Math.floor(numericValue);

  if (normalizedValue <= 0 || normalizedValue > 500_000_000) return undefined;

  return normalizedValue;
}

function getAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) return null;

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function mergeKickFollowerPayload(
  currentPayload: unknown,
  username: string,
  followerCount: number,
  source: string,
) {
  const basePayload =
    currentPayload && typeof currentPayload === "object" && !Array.isArray(currentPayload)
      ? (currentPayload as Record<string, unknown>)
      : {};

  return {
    ...basePayload,
    platform: "kick",
    username,
    followerCount,
    externalCount: followerCount,
    kickFollowerCache: {
      followerCount,
      count: followerCount,
      source,
      updatedAt: new Date().toISOString(),
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => null)) as CachePayload | null;

    if (!payload) {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const username = normalizeKickUsername(String(payload.username || ""));
    const followerCount = getSafeFollowerCount(payload.followerCount);
    const creatorId = payload.creatorId ? String(payload.creatorId) : null;
    const source = String(payload.source || "kick_goals_browser");

    if (!username || !followerCount) {
      return NextResponse.json(
        { ok: false, error: "username and followerCount are required." },
        { status: 400 },
      );
    }

    const adminSupabase = getAdminSupabaseClient();

    if (!adminSupabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase service role env missing." },
        { status: 500 },
      );
    }

    let existingQuery = adminSupabase
      .from("creator_live_status")
      .select("id, raw_payload")
      .eq("platform", "kick")
      .order("updated_at", { ascending: false })
      .limit(1);

    if (creatorId) {
      existingQuery = existingQuery.eq("creator_id", creatorId);
    } else {
      existingQuery = existingQuery.eq("platform_username", username);
    }

    const { data: existingRow, error: existingError } = await existingQuery.maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { ok: false, error: existingError.message },
        { status: 500 },
      );
    }

    const nextRawPayload = mergeKickFollowerPayload(
      (existingRow as { raw_payload?: unknown } | null)?.raw_payload,
      username,
      followerCount,
      source,
    );

    if (existingRow?.id) {
      const { error: updateError } = await adminSupabase
        .from("creator_live_status")
        .update({
          platform_username: username,
          raw_payload: nextRawPayload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingRow.id);

      if (updateError) {
        return NextResponse.json(
          { ok: false, error: updateError.message },
          { status: 500 },
        );
      }
    } else if (creatorId) {
      const { error: insertError } = await adminSupabase
        .from("creator_live_status")
        .insert({
          creator_id: creatorId,
          platform: "kick",
          platform_username: username,
          is_live: false,
          viewer_count: 0,
          live_url: `https://kick.com/${username}`,
          raw_payload: nextRawPayload,
          last_checked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        return NextResponse.json(
          { ok: false, error: insertError.message },
          { status: 500 },
        );
      }
    } else {
      return NextResponse.json(
        {
          ok: false,
          error: "creatorId is required when no existing cache row is found.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      username,
      followerCount,
      source,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      },
      { status: 500 },
    );
  }
}
