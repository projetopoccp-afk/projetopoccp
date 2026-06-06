import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SimulateDropBody = {
  accessToken?: string;
  creatorId?: string;
  dropId?: string;
};

type DropRecord = {
  id: string;
  creator_id: string;
  platform: string;
  reward_type: string;
  max_claims: number;
  current_claims: number;
  ends_at: string;
  is_active: boolean;
};

type LinkedAccountRecord = {
  user_id: string;
  platform_username: string | null;
};

const SIMULATED_XP_AMOUNT = 100;

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

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

async function createBestEffortNotification(params: {
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>;
  userId: string;
  rewardType: string;
  creatorId: string;
  dropId: string;
}) {
  const { supabaseAdmin, userId, rewardType, creatorId, dropId } = params;

  await supabaseAdmin
    .from("user_notifications")
    .insert({
      user_id: userId,
      type: rewardType === "xp" ? "generic" : "package_received",
      title:
        rewardType === "xp"
          ? "Você recebeu XP em um drop!"
          : "Você recebeu um pack em um drop!",
      message:
        rewardType === "xp"
          ? `Você recebeu ${SIMULATED_XP_AMOUNT} XP em um drop de live.`
          : "Você recebeu um Pack Aleatório em um drop de live.",
      metadata: {
        source: "live_drop_simulation",
        creator_id: creatorId,
        drop_id: dropId,
        reward_type: rewardType,
      },
      read: false,
    })
    .then(({ error }) => {
      if (error) {
        console.warn("Drop notification skipped:", error.message);
      }
    });
}

async function grantRandomPack(params: {
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>;
  userId: string;
}) {
  const { supabaseAdmin, userId } = params;

  const { data: pack, error: packError } = await supabaseAdmin
    .from("packs")
    .select("id,name,pack_type")
    .eq("pack_type", "random_pack")
    .eq("is_active", true)
    .maybeSingle();

  if (packError || !pack) {
    console.error("Drop random pack lookup error:", packError);
    throw new Error("random_pack_not_found");
  }

  const { data: grantedPackId, error: grantError } = await supabaseAdmin.rpc(
    "grant_user_pack",
    {
      p_target_user_id: userId,
      p_pack_id: pack.id,
      p_source: "live_drop_simulation",
    },
  );

  if (grantError) {
    console.error("Drop grant_user_pack error:", grantError);
    throw new Error("pack_grant_failed");
  }

  return {
    packId: pack.id,
    packName: pack.name,
    packType: pack.pack_type,
    grantedPackId,
  };
}

async function grantXpBestEffort(params: {
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>;
  userId: string;
}) {
  const { supabaseAdmin, userId } = params;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id,xp")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("Drop XP profile lookup error:", profileError);
    throw new Error("profile_not_found_for_xp");
  }

  const currentXp = Math.max(0, Math.floor(Number(profile.xp) || 0));

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ xp: currentXp + SIMULATED_XP_AMOUNT })
    .eq("id", userId);

  if (updateError) {
    console.error("Drop XP update error:", updateError);
    throw new Error("xp_grant_failed");
  }

  await supabaseAdmin
    .from("user_xp_events")
    .insert({
      user_id: userId,
      amount: SIMULATED_XP_AMOUNT,
      source: "live_drop_simulation",
      metadata: {
        xp: SIMULATED_XP_AMOUNT,
      },
    })
    .then(({ error }) => {
      if (error) {
        console.warn("Drop XP event skipped:", error.message);
      }
    });

  return { xpAmount: SIMULATED_XP_AMOUNT };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as SimulateDropBody;
    const accessToken = body.accessToken;
    const creatorId = String(body.creatorId || "").trim();
    const dropId = String(body.dropId || "").trim();

    if (!accessToken) {
      return NextResponse.json({ error: "missing_supabase_access_token" }, { status: 401 });
    }

    if (!creatorId) {
      return NextResponse.json({ error: "missing_creator_id" }, { status: 400 });
    }

    if (!dropId) {
      return NextResponse.json({ error: "missing_drop_id" }, { status: 400 });
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

    const { data: drop, error: dropError } = await supabaseAdmin
      .from("creator_drops")
      .select("id,creator_id,platform,reward_type,max_claims,current_claims,ends_at,is_active")
      .eq("id", dropId)
      .eq("creator_id", creatorId)
      .maybeSingle<DropRecord>();

    if (dropError || !drop) {
      return NextResponse.json({ error: "drop_not_found" }, { status: 404 });
    }

    const isActive = drop.is_active && new Date(drop.ends_at).getTime() > Date.now();

    if (!isActive) {
      return NextResponse.json({ error: "drop_not_active" }, { status: 400 });
    }

    if (drop.current_claims >= drop.max_claims) {
      return NextResponse.json({ error: "drop_limit_reached" }, { status: 400 });
    }

    if (!["random_pack", "xp"].includes(drop.reward_type)) {
      return NextResponse.json({ error: "unsupported_reward_type" }, { status: 400 });
    }

    const { data: existingClaims, error: claimsError } = await supabaseAdmin
      .from("drop_claims")
      .select("user_id")
      .eq("drop_id", drop.id);

    if (claimsError) {
      console.error("Drop claims lookup error:", claimsError);
      return NextResponse.json({ error: "claims_lookup_failed" }, { status: 500 });
    }

    const alreadyClaimed = new Set((existingClaims || []).map((claim) => String(claim.user_id)));

    const { data: linkedAccounts, error: linkedAccountsError } = await supabaseAdmin
      .from("user_social_accounts")
      .select("user_id,platform_username")
      .eq("platform", drop.platform)
      .limit(1000);

    if (linkedAccountsError) {
      console.error("Drop linked accounts lookup error:", linkedAccountsError);
      return NextResponse.json({ error: "linked_accounts_lookup_failed" }, { status: 500 });
    }

    const eligibleAccounts = ((linkedAccounts || []) as LinkedAccountRecord[]).filter(
      (account) => account.user_id && !alreadyClaimed.has(account.user_id),
    );

    if (eligibleAccounts.length === 0) {
      return NextResponse.json({ error: "no_eligible_user" }, { status: 404 });
    }

    const winner = pickRandom(eligibleAccounts);

    let rewardPayload: Record<string, unknown> = {};

    if (drop.reward_type === "random_pack") {
      rewardPayload = await grantRandomPack({
        supabaseAdmin,
        userId: winner.user_id,
      });
    } else if (drop.reward_type === "xp") {
      rewardPayload = await grantXpBestEffort({
        supabaseAdmin,
        userId: winner.user_id,
      });
    }

    const { error: claimInsertError } = await supabaseAdmin.from("drop_claims").insert({
      drop_id: drop.id,
      user_id: winner.user_id,
      platform: drop.platform,
      platform_username: winner.platform_username,
    });

    if (claimInsertError) {
      console.error("Drop claim insert error:", claimInsertError);
      return NextResponse.json({ error: "claim_insert_failed" }, { status: 500 });
    }

    const nextClaims = drop.current_claims + 1;
    const reachedLimit = nextClaims >= drop.max_claims;

    const { error: dropUpdateError } = await supabaseAdmin
      .from("creator_drops")
      .update({
        current_claims: nextClaims,
        is_active: reachedLimit ? false : true,
        ...(reachedLimit ? { ends_at: new Date().toISOString() } : {}),
      })
      .eq("id", drop.id);

    if (dropUpdateError) {
      console.error("Drop current_claims update error:", dropUpdateError);
      return NextResponse.json({ error: "drop_update_failed" }, { status: 500 });
    }

    await createBestEffortNotification({
      supabaseAdmin,
      userId: winner.user_id,
      rewardType: drop.reward_type,
      creatorId,
      dropId: drop.id,
    });

    return NextResponse.json({
      ok: true,
      winnerUserId: winner.user_id,
      winnerUsername: winner.platform_username,
      rewardType: drop.reward_type,
      reward: rewardPayload,
      currentClaims: nextClaims,
      maxClaims: drop.max_claims,
      ended: reachedLimit,
    });
  } catch (error) {
    console.error("Simulate drop winner route error:", error);
    return NextResponse.json({ error: "drop_simulate_failed" }, { status: 500 });
  }
}
