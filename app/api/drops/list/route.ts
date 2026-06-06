import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ListDropsBody = {
  accessToken?: string;
  creatorId?: string;
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as ListDropsBody;
    const accessToken = body.accessToken;
    const creatorId = String(body.creatorId || "").trim();

    if (!accessToken) {
      return NextResponse.json({ error: "missing_supabase_access_token" }, { status: 401 });
    }

    if (!creatorId) {
      return NextResponse.json({ error: "missing_creator_id" }, { status: 400 });
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

    const { data: drops, error: dropsError } = await supabaseAdmin
      .from("creator_drops")
      .select("id,creator_id,platform,keyword,reward_type,viewer_count_at_start,drop_percentage,max_claims,current_claims,starts_at,ends_at,is_active,created_at")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (dropsError) {
      console.error("List drops error:", dropsError);
      return NextResponse.json({ error: "drops_list_failed" }, { status: 500 });
    }

    return NextResponse.json({ drops: drops || [] });
  } catch (error) {
    console.error("List drops route error:", error);
    return NextResponse.json({ error: "drops_list_failed" }, { status: 500 });
  }
}
