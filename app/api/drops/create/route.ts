import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateDropBody = {
  accessToken?: string;
  creatorId?: string;
  platform?: string;
  keyword?: string;
  rewardType?: string;
  durationMinutes?: number;
  viewerCount?: number;
  dropPercentage?: number;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function createSupabaseAnonClient() {
  return createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

function createSupabaseAdminClient() {
  return createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

function clampDurationMinutes(value: number) {
  if ([5, 10, 30].includes(value)) return value;
  return 10;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as CreateDropBody;
    const accessToken = body.accessToken;

    if (!accessToken) {
      return NextResponse.json({ error: "missing_supabase_access_token" }, { status: 401 });
    }

    const creatorId = String(body.creatorId || "").trim();
    const platform = String(body.platform || "kick").trim().toLowerCase();
    const keyword = String(body.keyword || "CARDPOC").trim().toUpperCase();
    const rewardType = String(body.rewardType || "random_pack")
      .trim()
      .toLowerCase();
    const viewerCount = Math.max(0, Math.floor(Number(body.viewerCount) || 0));
    const dropPercentage = Math.max(1, Math.min(100, Math.floor(Number(body.dropPercentage) || 15)));
    const durationMinutes = clampDurationMinutes(Math.floor(Number(body.durationMinutes) || 10));

    if (!creatorId) {
      return NextResponse.json({ error: "missing_creator_id" }, { status: 400 });
    }

    if (platform !== "kick") {
      return NextResponse.json({ error: "unsupported_platform" }, { status: 400 });
    }

    if (!keyword) {
      return NextResponse.json({ error: "missing_keyword" }, { status: 400 });
    }

    if (!["xp", "random_pack"].includes(rewardType)) {
      return NextResponse.json({ error: "unsupported_reward_type" }, { status: 400 });
    }

    if (viewerCount <= 0) {
      return NextResponse.json({ error: "invalid_viewer_count" }, { status: 400 });
    }

    const supabaseAuth = createSupabaseAnonClient();
    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ error: "invalid_supabase_session" }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    const { data: creatorProfile, error: creatorError } = await supabaseAdmin
      .from("creator_profiles")
      .select("id,user_id")
      .eq("id", creatorId)
      .maybeSingle();

    if (creatorError || !creatorProfile) {
      return NextResponse.json({ error: "creator_not_found" }, { status: 404 });
    }

    const { data: accountProfile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    const isOwner = creatorProfile.user_id === user.id;
    const isAdmin = Boolean(accountProfile?.is_admin);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "not_allowed" }, { status: 403 });
    }

    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);
    const maxClaims = Math.max(1, Math.floor(viewerCount * (dropPercentage / 100)));

    const { data: drop, error: insertError } = await supabaseAdmin
      .from("creator_drops")
      .insert({
        creator_id: creatorId,
        platform,
        keyword,
        reward_type: rewardType,
        reward_id: null,
        viewer_count_at_start: viewerCount,
        drop_percentage: dropPercentage,
        max_claims: maxClaims,
        current_claims: 0,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        is_active: true,
        created_by: user.id,
      })
      .select("id,creator_id,platform,keyword,reward_type,viewer_count_at_start,drop_percentage,max_claims,current_claims,starts_at,ends_at,is_active,created_at")
      .single();

    if (insertError) {
      console.error("Create drop insert error:", insertError);
      return NextResponse.json({ error: "drop_insert_failed" }, { status: 500 });
    }

    return NextResponse.json({ drop });
  } catch (error) {
    console.error("Create drop error:", error);
    return NextResponse.json({ error: "drop_create_failed" }, { status: 500 });
  }
}
