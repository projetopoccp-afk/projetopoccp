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

const DROP_CREATE_COOLDOWN_HOURS = 2;
const DEFAULT_PLATFORM = "kick";
const SUPPORTED_DROP_PLATFORMS = new Set(["kick", "twitch"]);
const DEFAULT_KEYWORD = "CARDPOC";
const DEFAULT_DROP_PERCENTAGE = 15;

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

function sanitizeKeyword(value: unknown) {
  const keyword = String(value || DEFAULT_KEYWORD)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");

  return keyword || DEFAULT_KEYWORD;
}

function sanitizePlatform(value: unknown) {
  const platform = String(value || DEFAULT_PLATFORM).trim().toLowerCase();

  return platform || DEFAULT_PLATFORM;
}

function sanitizeRewardType(value: unknown) {
  const rewardType = String(value || "random_pack").trim().toLowerCase();

  if (rewardType === "xp") return "xp";
  if (rewardType === "random_pack") return "random_pack";

  return "";
}

function sanitizePositiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value);
  const integer = Math.floor(parsed);

  if (!Number.isFinite(integer) || integer < 1) {
    return fallback;
  }

  return integer;
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as CreateDropBody;

    const accessToken = body.accessToken;
    const creatorId = String(body.creatorId || "").trim();
    const platform = sanitizePlatform(body.platform);
    const keyword = sanitizeKeyword(body.keyword);
    const rewardType = sanitizeRewardType(body.rewardType);
    const durationMinutes = sanitizePositiveInteger(body.durationMinutes, 10);
    // Segurança: o frontend pode enviar viewerCount/dropPercentage para exibição/compatibilidade,
    // mas o backend sempre usa dados confiáveis do banco.
    const dropPercentage = DEFAULT_DROP_PERCENTAGE;

    if (!accessToken) {
      return NextResponse.json(
        { error: "missing_supabase_access_token" },
        { status: 401 },
      );
    }

    if (!creatorId) {
      return NextResponse.json({ error: "missing_creator_id" }, { status: 400 });
    }

    if (!SUPPORTED_DROP_PLATFORMS.has(platform)) {
      return NextResponse.json(
        { error: "unsupported_drop_platform" },
        { status: 400 },
      );
    }

    if (!rewardType) {
      return NextResponse.json(
        { error: "unsupported_reward_type" },
        { status: 400 },
      );
    }

    const supabaseAuth = createSupabaseAnonClient();
    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "invalid_supabase_session" },
        { status: 401 },
      );
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

    const { data: liveStatus, error: liveStatusError } = await supabaseAdmin
      .from("creator_live_status")
      .select("is_live,viewer_count,last_checked_at,platform")
      .eq("creator_id", creatorId)
      .eq("platform", platform)
      .maybeSingle();

    if (liveStatusError) {
      console.error("Live status lookup error:", liveStatusError);

      return NextResponse.json(
        { error: "live_status_lookup_failed" },
        { status: 500 },
      );
    }

    if (!liveStatus?.is_live) {
      return NextResponse.json(
        { error: "creator_not_live" },
        { status: 400 },
      );
    }

    const viewerCount = Math.max(
      0,
      Math.floor(Number(liveStatus.viewer_count) || 0),
    );

    if (viewerCount <= 0) {
      return NextResponse.json(
        { error: "invalid_live_viewer_count" },
        { status: 400 },
      );
    }

    const { data: activeDrop, error: activeDropError } = await supabaseAdmin
      .from("creator_drops")
      .select("id,created_at,ends_at")
      .eq("creator_id", creatorId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeDropError) {
      console.error("Active drop lookup error:", activeDropError);

      return NextResponse.json(
        { error: "active_drop_lookup_failed" },
        { status: 500 },
      );
    }

    if (activeDrop) {
      return NextResponse.json(
        {
          error: "active_drop_already_exists",
          activeDropId: activeDrop.id,
          activeDropCreatedAt: activeDrop.created_at,
          activeDropEndsAt: activeDrop.ends_at,
        },
        { status: 409 },
      );
    }

    const now = new Date();
    const cooldownStart = addHours(now, -DROP_CREATE_COOLDOWN_HOURS).toISOString();

    const { data: recentDrop, error: recentDropError } = await supabaseAdmin
      .from("creator_drops")
      .select("id,created_at")
      .eq("creator_id", creatorId)
      .gte("created_at", cooldownStart)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentDropError) {
      console.error("Drop cooldown lookup error:", recentDropError);

      return NextResponse.json(
        { error: "drop_cooldown_lookup_failed" },
        { status: 500 },
      );
    }

    if (recentDrop?.created_at) {
      const nextAvailableAt = addHours(
        new Date(recentDrop.created_at),
        DROP_CREATE_COOLDOWN_HOURS,
      );

      const remainingMilliseconds = Math.max(
        0,
        nextAvailableAt.getTime() - now.getTime(),
      );

      return NextResponse.json(
        {
          error: "drop_cooldown_active",
          lastDropId: recentDrop.id,
          lastDropCreatedAt: recentDrop.created_at,
          nextAvailableAt: nextAvailableAt.toISOString(),
          remainingMinutes: Math.ceil(remainingMilliseconds / 60000),
        },
        { status: 429 },
      );
    }

    const maxClaims = Math.max(
      1,
      Math.floor(viewerCount * (dropPercentage / 100)),
    );

    const startsAt = now;
    const endsAt = addMinutes(now, durationMinutes);

    const { data: createdDrop, error: createError } = await supabaseAdmin
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
      .select("*")
      .single();

    if (createError || !createdDrop) {
      console.error("Drop create insert error:", createError);

      return NextResponse.json(
        { error: "drop_create_failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      drop: createdDrop,
      cooldownHours: DROP_CREATE_COOLDOWN_HOURS,
      nextAvailableAt: addHours(now, DROP_CREATE_COOLDOWN_HOURS).toISOString(),
    });
  } catch (error) {
    console.error("Create drop route error:", error);

    return NextResponse.json(
      { error: "drop_create_failed" },
      { status: 500 },
    );
  }
}
