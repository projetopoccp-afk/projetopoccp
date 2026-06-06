import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ListDropsBody = {
  accessToken?: string;
  creatorId?: string;
};

type DropRecord = {
  id: string;
  creator_id: string;
  platform: string;
  keyword: string;
  reward_type: string;
  reward_id?: string | null;
  viewer_count_at_start: number;
  drop_percentage: number;
  max_claims: number;
  current_claims: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
};

type DropEntryRecord = {
  id: string;
  drop_id: string;
  user_id: string;
  platform: string;
  platform_username: string | null;
  entered_at: string;
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
      return NextResponse.json(
        { error: "missing_supabase_access_token" },
        { status: 401 },
      );
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
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (dropsError) {
      console.error("Drops list lookup error:", dropsError);
      return NextResponse.json({ error: "drops_lookup_failed" }, { status: 500 });
    }

    const typedDrops = (drops || []) as DropRecord[];
    const dropIds = typedDrops.map((drop) => drop.id).filter(Boolean);

    let entriesByDropId = new Map<string, DropEntryRecord[]>();

    if (dropIds.length > 0) {
      const { data: entries, error: entriesError } = await supabaseAdmin
        .from("drop_entries")
        .select("id,drop_id,user_id,platform,platform_username,entered_at")
        .in("drop_id", dropIds)
        .order("entered_at", { ascending: true });

      if (entriesError) {
        console.error("Drops entries lookup error:", entriesError);
        return NextResponse.json(
          { error: "drop_entries_lookup_failed" },
          { status: 500 },
        );
      }

      entriesByDropId = ((entries || []) as DropEntryRecord[]).reduce(
        (map, entry) => {
          const current = map.get(entry.drop_id) || [];
          current.push(entry);
          map.set(entry.drop_id, current);
          return map;
        },
        new Map<string, DropEntryRecord[]>(),
      );
    }

    const dropsWithEntries = typedDrops.map((drop) => ({
      ...drop,
      entries: entriesByDropId.get(drop.id) || [],
    }));

    return NextResponse.json({ drops: dropsWithEntries });
  } catch (error) {
    console.error("Drops list route error:", error);
    return NextResponse.json({ error: "drops_list_failed" }, { status: 500 });
  }
}
