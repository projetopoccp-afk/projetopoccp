import { createClient } from "@supabase/supabase-js";

type DropEntry = {
  id: string;
  drop_id: string;
  user_id: string;
  platform: string;
  platform_username: string | null;
};

export type ProcessDropDrawResult = {
  ok: boolean;
  dropId?: string;
  rewardType?: string;
  winners?: Array<{
    userId: string;
    platformUsername: string | null;
    packId: string | null;
  }>;
  winnersCount?: number;
  currentClaims?: number;
  maxClaims?: number;
  closed?: boolean;
  error?: string;
  status: number;
};

export function createSupabaseAdminClient() {
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

function shuffleArray<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

async function createDropNotificationOnce(params: {
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>;
  userId: string;
  dropId: string;
  creatorId: string | null;
  platform: string;
  platformUsername: string | null;
  rewardType: string;
  packId: string | null;
}) {
  const {
    supabaseAdmin,
    userId,
    dropId,
    creatorId,
    platform,
    platformUsername,
    rewardType,
    packId,
  } = params;

  const { data: existingNotification, error: existingNotificationError } =
    await supabaseAdmin
      .from("user_notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "package_received")
      .contains("metadata", {
        drop_id: dropId,
        source: "live_drop_draw",
      })
      .maybeSingle();

  if (existingNotificationError) {
    console.error(
      "Drop draw existing notification lookup error:",
      existingNotificationError,
    );
  }

  if (existingNotification) {
    return;
  }

  const { error: notificationError } = await supabaseAdmin
    .from("user_notifications")
    .insert({
      user_id: userId,
      type: "package_received",
      title: "🎁 Drop recebido",
      message:
        "Você foi sorteado em um Drop de Live e recebeu um Pack Aleatório.",
      metadata: {
        drop_id: dropId,
        creator_id: creatorId,
        platform,
        platform_username: platformUsername,
        reward_type: rewardType,
        pack_id: packId,
        source: "live_drop_draw",
      },
    });

  if (notificationError) {
    console.error("Drop draw notification error:", notificationError);
  }
}

export async function processDropDraw(
  dropId: string,
  supabaseAdmin = createSupabaseAdminClient(),
): Promise<ProcessDropDrawResult> {
  const normalizedDropId = String(dropId || "").trim();

  if (!normalizedDropId) {
    return { ok: false, error: "missing_drop_id", status: 400 };
  }

  const { data: drop, error: dropError } = await supabaseAdmin
    .from("creator_drops")
    .select("*")
    .eq("id", normalizedDropId)
    .single();

  if (dropError || !drop) {
    return { ok: false, error: "drop_not_found", status: 404 };
  }

  const { data: alreadyClaimed, error: claimedError } = await supabaseAdmin
    .from("drop_claims")
    .select("user_id")
    .eq("drop_id", drop.id);

  if (claimedError) {
    console.error("Drop draw claimed lookup error:", claimedError);

    return { ok: false, error: "claimed_lookup_failed", status: 500 };
  }

  const claimedUserIds = new Set(
    (alreadyClaimed || []).map((claim) => claim.user_id),
  );

  const alreadyClaimedCount = Number(alreadyClaimed?.length || 0);
  const remainingSlots = Number(drop.max_claims || 0) - alreadyClaimedCount;

  if (remainingSlots <= 0) {
    await supabaseAdmin
      .from("creator_drops")
      .update({
        current_claims: alreadyClaimedCount,
        is_active: false,
      })
      .eq("id", drop.id);

    return { ok: false, error: "drop_full", status: 409 };
  }

  const { data: entries, error: entriesError } = await supabaseAdmin
    .from("drop_entries")
    .select("id, drop_id, user_id, platform, platform_username")
    .eq("drop_id", drop.id);

  if (entriesError) {
    console.error("Drop draw entries lookup error:", entriesError);

    return { ok: false, error: "entries_lookup_failed", status: 500 };
  }

  const eligibleEntries = ((entries || []) as DropEntry[]).filter(
    (entry) => !claimedUserIds.has(entry.user_id),
  );

  if (eligibleEntries.length === 0) {
    await supabaseAdmin
      .from("creator_drops")
      .update({
        current_claims: alreadyClaimedCount,
        is_active: false,
      })
      .eq("id", drop.id);

    return { ok: false, error: "no_eligible_entries", status: 404 };
  }

  const winners = shuffleArray(eligibleEntries).slice(0, remainingSlots);

  const { data: randomPack, error: packError } =
    drop.reward_type === "random_pack"
      ? await supabaseAdmin
          .from("packs")
          .select("id, name, pack_type")
          .eq("pack_type", "random_pack")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle()
      : { data: null, error: null };

  if (drop.reward_type === "random_pack" && (packError || !randomPack?.id)) {
    console.error("Drop draw random pack lookup error:", packError);

    return { ok: false, error: "random_pack_not_found", status: 500 };
  }

  const awardedUsers: Array<{
    userId: string;
    platformUsername: string | null;
    packId: string | null;
  }> = [];

  for (const winner of winners) {
    let grantedPackId: string | null = null;

    if (drop.reward_type === "random_pack" && randomPack?.id) {
      const { error: grantError } = await supabaseAdmin.rpc(
        "grant_user_pack_system",
        {
          p_target_user_id: winner.user_id,
          p_pack_id: randomPack.id,
          p_source: "live_drop_draw",
        },
      );

      if (grantError) {
        console.error("Drop draw grant pack error:", {
          userId: winner.user_id,
          grantError,
        });

        continue;
      }

      grantedPackId = randomPack.id;
    }

    const { error: claimError } = await supabaseAdmin
      .from("drop_claims")
      .insert({
        drop_id: drop.id,
        user_id: winner.user_id,
        platform: winner.platform || "kick",
        platform_username: winner.platform_username,
        claimed_at: new Date().toISOString(),
      });

    if (claimError) {
      console.error("Drop draw claim insert error:", {
        userId: winner.user_id,
        claimError,
      });

      continue;
    }

    await createDropNotificationOnce({
      supabaseAdmin,
      userId: winner.user_id,
      dropId: drop.id,
      creatorId: drop.creator_id ?? null,
      platform: winner.platform || "kick",
      platformUsername: winner.platform_username,
      rewardType: drop.reward_type,
      packId: grantedPackId,
    });

    awardedUsers.push({
      userId: winner.user_id,
      platformUsername: winner.platform_username,
      packId: grantedPackId,
    });
  }

  const finalClaims = alreadyClaimedCount + awardedUsers.length;

  await supabaseAdmin
    .from("creator_drops")
    .update({
      current_claims: finalClaims,
      is_active: false,
    })
    .eq("id", drop.id);

  return {
    ok: true,
    dropId: drop.id,
    rewardType: drop.reward_type,
    winners: awardedUsers,
    winnersCount: awardedUsers.length,
    currentClaims: finalClaims,
    maxClaims: drop.max_claims,
    closed: true,
    status: 200,
  };
}
