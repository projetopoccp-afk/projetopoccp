import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type DrawDropBody = {
  dropId?: string;
};

type DropEntry = {
  id: string;
  drop_id: string;
  user_id: string;
  platform: string;
  platform_username: string | null;
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

function shuffleArray<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DrawDropBody;
    const dropId = String(body.dropId || "").trim();

    if (!dropId) {
      return NextResponse.json({ error: "missing_drop_id" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    const { data: drop, error: dropError } = await supabaseAdmin
      .from("creator_drops")
      .select("*")
      .eq("id", dropId)
      .single();

    if (dropError || !drop) {
      return NextResponse.json({ error: "drop_not_found" }, { status: 404 });
    }

    if ((drop.current_claims || 0) >= drop.max_claims) {
      await supabaseAdmin
        .from("creator_drops")
        .update({ is_active: false })
        .eq("id", drop.id);

      return NextResponse.json({ error: "drop_full" }, { status: 409 });
    }

    const remainingSlots =
      Number(drop.max_claims || 0) - Number(drop.current_claims || 0);

    const { data: alreadyClaimed, error: claimedError } = await supabaseAdmin
      .from("drop_claims")
      .select("user_id")
      .eq("drop_id", drop.id);

    if (claimedError) {
      console.error("Drop draw claimed lookup error:", claimedError);

      return NextResponse.json(
        { error: "claimed_lookup_failed" },
        { status: 500 },
      );
    }

    const claimedUserIds = new Set(
      (alreadyClaimed || []).map((claim) => claim.user_id),
    );

    const { data: entries, error: entriesError } = await supabaseAdmin
      .from("drop_entries")
      .select("id, drop_id, user_id, platform, platform_username")
      .eq("drop_id", drop.id);

    if (entriesError) {
      console.error("Drop draw entries lookup error:", entriesError);

      return NextResponse.json(
        { error: "entries_lookup_failed" },
        { status: 500 },
      );
    }

    const eligibleEntries = ((entries || []) as DropEntry[]).filter(
      (entry) => !claimedUserIds.has(entry.user_id),
    );

    if (eligibleEntries.length === 0) {
      return NextResponse.json(
        { error: "no_eligible_entries" },
        { status: 404 },
      );
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

      return NextResponse.json(
        { error: "random_pack_not_found" },
        { status: 500 },
      );
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
            p_source: "live_drop",
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

      await supabaseAdmin
        .from("user_notifications")
        .insert({
          user_id: winner.user_id,
          type:
            drop.reward_type === "random_pack" ? "package_received" : "generic",
          title:
            drop.reward_type === "random_pack"
              ? "🎁 Drop recebido"
              : "🎁 Recompensa recebida",
          message:
            drop.reward_type === "random_pack"
              ? "Você recebeu um Pack Aleatório através de um sorteio de Drop de Live."
              : "Você recebeu uma recompensa através de um sorteio de Drop de Live.",
          metadata: {
            drop_id: drop.id,
            creator_id: drop.creator_id,
            platform: winner.platform || "kick",
            platform_username: winner.platform_username,
            reward_type: drop.reward_type,
            pack_id: grantedPackId,
            source: "live_drop_draw",
          },
        })
        .then(({ error }) => {
          if (error) {
            console.error("Drop draw notification error:", error);
          }
        });

      awardedUsers.push({
        userId: winner.user_id,
        platformUsername: winner.platform_username,
        packId: grantedPackId,
      });
    }

    const nextClaims = Number(drop.current_claims || 0) + awardedUsers.length;
    const shouldCloseDrop = nextClaims >= Number(drop.max_claims || 0);

    await supabaseAdmin
      .from("creator_drops")
      .update({
        current_claims: nextClaims,
        is_active: shouldCloseDrop ? false : false,
      })
      .eq("id", drop.id);

    return NextResponse.json({
      ok: true,
      dropId: drop.id,
      rewardType: drop.reward_type,
      winners: awardedUsers,
      winnersCount: awardedUsers.length,
      currentClaims: nextClaims,
      maxClaims: drop.max_claims,
      closed: true,
    });
  } catch (error) {
    console.error("Drop draw unexpected error:", error);

    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}