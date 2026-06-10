import { NextResponse } from "next/server";
import {
  getActivityStatus,
  getAuthenticatedUser,
  getNextRewardDateStartIso,
  getRewardDate,
  getSupabaseClients,
} from "../_shared";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { userClient, adminClient } = getSupabaseClients(request.headers.get("authorization"));
    const { user } = await getAuthenticatedUser(userClient);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const rewardDate = getRewardDate();

    const { data: dailyReward, error: dailyError } = await adminClient
      .from("daily_rewards")
      .select("pack_type, claimed_at")
      .eq("user_id", user.id)
      .eq("reward_date", rewardDate)
      .maybeSingle();

    if (dailyError) {
      throw dailyError;
    }

    const activityReward = await getActivityStatus(adminClient, user.id, rewardDate);

    const { count: streakCount } = await adminClient
      .from("daily_rewards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    return NextResponse.json({
      dailyReward: {
        claimed: Boolean(dailyReward),
        claimedAt: dailyReward?.claimed_at ?? null,
        packType: dailyReward?.pack_type ?? null,
        nextClaimAt: getNextRewardDateStartIso(),
      },
      activityReward,
      streak: {
        current: streakCount ?? 0,
      },
    });
  } catch (error) {
    console.error("Erro em /api/rewards/status:", error);
    return NextResponse.json(
      { message: "Não foi possível carregar as recompensas." },
      { status: 500 },
    );
  }
}
