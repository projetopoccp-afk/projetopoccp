import { NextResponse } from "next/server";
import {
  createRewardEvent,
  createUserNotification,
  getAuthenticatedUser,
  getNextRewardDateStartIso,
  getRewardDate,
  getSupabaseClients,
  rollDailyPackType,
} from "../_shared";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { userClient, adminClient } = getSupabaseClients(request.headers.get("authorization"));
    const { user } = await getAuthenticatedUser(userClient);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const rewardDate = getRewardDate();

    const { data: existingReward, error: existingError } = await adminClient
      .from("daily_rewards")
      .select("id, pack_type, claimed_at")
      .eq("user_id", user.id)
      .eq("reward_date", rewardDate)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingReward) {
      return NextResponse.json(
        {
          ok: false,
          message: "Você já resgatou o pacote diário de hoje.",
          nextClaimAt: getNextRewardDateStartIso(),
        },
        { status: 409 },
      );
    }

    const packType = rollDailyPackType();

    const { data: pack, error: packError } = await adminClient
      .from("packs")
      .select("id, name, pack_type")
      .eq("pack_type", packType)
      .eq("is_active", true)
      .maybeSingle();

    if (packError || !pack) {
      console.error("Erro ao buscar pacote diário:", packError);
      return NextResponse.json(
        {
          ok: false,
          message: "Pacote diário não encontrado. Confira se os packs estão ativos no banco.",
        },
        { status: 404 },
      );
    }

    const { data: dailyReward, error: dailyInsertError } = await adminClient
      .from("daily_rewards")
      .insert({
        user_id: user.id,
        reward_date: rewardDate,
        pack_type: packType,
      })
      .select("id")
      .single();

    if (dailyInsertError) {
      if (dailyInsertError.code === "23505") {
        return NextResponse.json(
          {
            ok: false,
            message: "Você já resgatou o pacote diário de hoje.",
            nextClaimAt: getNextRewardDateStartIso(),
          },
          { status: 409 },
        );
      }

      throw dailyInsertError;
    }

    const { data: userPack, error: userPackError } = await adminClient
      .from("user_packs")
      .insert({
        user_id: user.id,
        pack_id: pack.id,
        source: "daily_reward",
      })
      .select("id")
      .single();

    if (userPackError) {
      throw userPackError;
    }

    await createRewardEvent(adminClient, {
      userId: user.id,
      type: "daily_pack_claimed",
      amount: 1,
      metadata: {
        reward_date: rewardDate,
        daily_reward_id: dailyReward.id,
        user_pack_id: userPack.id,
        pack_id: pack.id,
        pack_type: packType,
        source: "daily_reward",
      },
    });

    await createUserNotification(adminClient, {
      userId: user.id,
      type: "package_received",
      title: "Pacote diário resgatado!",
      message: `Você recebeu: ${pack.name}.`,
      metadata: {
        reward_date: rewardDate,
        daily_reward_id: dailyReward.id,
        user_pack_id: userPack.id,
        pack_id: pack.id,
        pack_type: packType,
        source: "daily_reward",
      },
    });

    return NextResponse.json({
      ok: true,
      packType,
      packName: pack.name,
      userPackId: userPack.id,
      nextClaimAt: getNextRewardDateStartIso(),
    });
  } catch (error) {
    console.error("Erro em /api/rewards/claim-daily:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Não foi possível resgatar o pacote diário.",
      },
      { status: 500 },
    );
  }
}
