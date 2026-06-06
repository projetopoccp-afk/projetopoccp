import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ListDropsBody = {
  accessToken?: string;
  creatorId?: string;
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
      .select(
        "id,creator_id,platform,keyword,reward_type,viewer_count_at_start,drop_percentage,max_claims,current_claims,starts_at,ends_at,is_active,created_at",
      )
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false })
      .limit(3);

    if (dropsError) {
      console.error("List drops error:", dropsError);
      return NextResponse.json({ error: "drops_list_failed" }, { status: 500 });
    }

    const dropIds = (drops || []).map((drop) => drop.id).filter(Boolean);
    let entriesByDropId: Record<string, DropEntryRecord[]> = {};

    if (dropIds.length > 0) {
      const { data: entries, error: entriesError } = await supabaseAdmin
        .from("drop_entries")
        .select("id,drop_id,user_id,platform,platform_username,entered_at")
        .in("drop_id", dropIds)
        .order("entered_at", { ascending: false })
        .limit(120);

      if (entriesError) {
        console.error("List drop entries error:", entriesError);
      } else {
        entriesByDropId = (entries || []).reduce<Record<string, DropEntryRecord[]>>(
          (acc, entry) => {
            const dropEntry: DropEntryRecord = {
              id: String(entry.id),
              drop_id: String(entry.drop_id),
              user_id: String(entry.user_id),
              platform: String(entry.platform || "kick"),
              platform_username: entry.platform_username
                ? String(entry.platform_username)
                : null,
              entered_at: String(entry.entered_at),
            };

            if (!acc[dropEntry.drop_id]) {
              acc[dropEntry.drop_id] = [];
            }

            acc[dropEntry.drop_id].push(dropEntry);

            return acc;
          },
          {},
        );

        Object.keys(entriesByDropId).forEach((dropIdKey) => {
          entriesByDropId[dropIdKey] = entriesByDropId[dropIdKey]
            .slice(0, 24)
            .reverse();
        });
      }
    }

    const dropsWithEntries = (drops || []).map((drop) => ({
      ...drop,
      entries: entriesByDropId[drop.id] || [],
    }));

    return NextResponse.json({ drops: dropsWithEntries });
  } catch (error) {
    console.error("List drops route error:", error);
    return NextResponse.json({ error: "drops_list_failed" }, { status: 500 });
  }
}
