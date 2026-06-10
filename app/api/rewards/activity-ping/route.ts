import { NextResponse } from "next/server";
import {
  ACTIVITY_MAX_CYCLES_PER_DAY,
  ACTIVITY_MAX_XP_PER_DAY,
  ACTIVITY_MINUTES_PER_CYCLE,
  ACTIVITY_XP_PER_CYCLE,
  createRewardEvent,
  createUserNotification,
  getActivityStatus,
  getAuthenticatedUser,
  getRewardDate,
  getSupabaseClients,
} from "../_shared";

export const dynamic = "force-dynamic";

const MIN_SECONDS_BETWEEN_COUNTED_PINGS = 45;
const MAX_MINUTES_PER_PING = 1;

export async function POST(request: Request) {
  try {
    const { userClient, adminClient } = getSupabaseClients(request.headers.get("authorization"));
    const { user } = await getAuthenticatedUser(userClient);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { active?: boolean };

    if (!body.active) {
      return NextResponse.json({ ok: true, counted: false });
    }

    const rewardDate = getRewardDate();
    const now = new Date();
    const nowIso = now.toISOString();

    const { data: currentRow, error: currentError } = await adminClient
      .from("user_activity_rewards")
      .select("id, minutes_active, xp_granted, reward_cycles, last_ping_at")
      .eq("user_id", user.id)
      .eq("reward_date", rewardDate)
      .maybeSingle();

    if (currentError) {
      throw currentError;
    }

    if (!currentRow) {
      const { error: insertError } = await adminClient.from("user_activity_rewards").insert({
        user_id: user.id,
        reward_date: rewardDate,
        minutes_active: 0,
        xp_granted: 0,
        reward_cycles: 0,
        last_ping_at: nowIso,
        updated_at: nowIso,
      });

      if (insertError) {
        throw insertError;
      }

      const activityStatus = await getActivityStatus(adminClient, user.id, rewardDate);

      return NextResponse.json({
        ...activityStatus,
        ok: true,
        counted: false,
        xpGranted: 0,
      });
    }

    const lastPingAt = currentRow.last_ping_at ? new Date(currentRow.last_ping_at) : null;
    const secondsSinceLastPing = lastPingAt
      ? Math.max(0, Math.floor((now.getTime() - lastPingAt.getTime()) / 1000))
      : 60;

    if (secondsSinceLastPing < MIN_SECONDS_BETWEEN_COUNTED_PINGS) {
      const activityStatus = await getActivityStatus(adminClient, user.id, rewardDate);

      return NextResponse.json({
        ...activityStatus,
        ok: true,
        counted: false,
        xpGranted: 0,
      });
    }

    const previousMinutesActive = Number(currentRow.minutes_active ?? 0);
    const previousXpGranted = Number(currentRow.xp_granted ?? 0);
    const previousRewardCycles = Number(currentRow.reward_cycles ?? 0);

    const minutesToAdd = Math.min(MAX_MINUTES_PER_PING, Math.max(1, Math.floor(secondsSinceLastPing / 60) || 1));
    const nextMinutesActive = previousMinutesActive + minutesToAdd;
    const earnedCyclesByMinutes = Math.floor(nextMinutesActive / ACTIVITY_MINUTES_PER_CYCLE);
    const possibleNewCycles = Math.max(0, earnedCyclesByMinutes - previousRewardCycles);
    const availableCycles = Math.max(0, ACTIVITY_MAX_CYCLES_PER_DAY - previousRewardCycles);
    const cyclesToGrant = Math.min(possibleNewCycles, availableCycles);
    const possibleXp = cyclesToGrant * ACTIVITY_XP_PER_CYCLE;
    const xpRoom = Math.max(0, ACTIVITY_MAX_XP_PER_DAY - previousXpGranted);
    const xpGranted = Math.min(possibleXp, xpRoom);
    const actualCyclesGranted = xpGranted > 0 ? Math.floor(xpGranted / ACTIVITY_XP_PER_CYCLE) : 0;
    const nextRewardCycles = previousRewardCycles + actualCyclesGranted;
    const nextXpGranted = previousXpGranted + xpGranted;

    const { error: updateError } = await adminClient
      .from("user_activity_rewards")
      .update({
        minutes_active: nextMinutesActive,
        xp_granted: nextXpGranted,
        reward_cycles: nextRewardCycles,
        last_ping_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", currentRow.id);

    if (updateError) {
      throw updateError;
    }

    if (xpGranted > 0) {
      const { error: xpError } = await adminClient.rpc("add_user_xp", {
        target_user_id: user.id,
        xp_value: xpGranted,
        xp_event_type: "online_activity_reward",
        xp_metadata: {
          reward_date: rewardDate,
          minutes_active: nextMinutesActive,
          reward_cycles: nextRewardCycles,
          source: "daily_activity",
        },
      });

      if (xpError) {
        console.error("Erro ao adicionar XP de atividade:", xpError);
      }

      await createRewardEvent(adminClient, {
        userId: user.id,
        type: "online_xp_granted",
        amount: xpGranted,
        metadata: {
          reward_date: rewardDate,
          minutes_active: nextMinutesActive,
          reward_cycles: nextRewardCycles,
          source: "daily_activity",
        },
      });

      await createUserNotification(adminClient, {
        userId: user.id,
        type: "xp_reward",
        title: "XP de atividade recebido!",
        message: `Você ganhou +${xpGranted} XP por permanecer ativo no Cardpoc.`,
        metadata: {
          xp: xpGranted,
          reward_date: rewardDate,
          minutes_active: nextMinutesActive,
          reward_cycles: nextRewardCycles,
          source: "daily_activity",
          xp_only: true,
        },
      });
    }

    const activityStatus = await getActivityStatus(adminClient, user.id, rewardDate);

    return NextResponse.json({
      ...activityStatus,
      ok: true,
      counted: true,
      xpGranted,
    });
  } catch (error) {
    console.error("Erro em /api/rewards/activity-ping:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Não foi possível registrar atividade.",
      },
      { status: 500 },
    );
  }
}
