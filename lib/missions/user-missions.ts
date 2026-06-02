import { supabase } from "@/lib/supabase/client";
import { createUserNotification } from "@/lib/notifications/user-notifications";

export type MissionProgressType =
  | "follow_creator"
  | "collect_card"
  | "share_profile"
  | "open_pack"
  | "complete_mission";

export async function updateMissionProgress(
  missionType: MissionProgressType,
  amount = 1,
  metadata: Record<string, unknown> = {}
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Missões: usuário não autenticado", userError);
    return;
  }

  const { data: missions, error: missionsError } = await supabase
    .from("missions")
    .select("*")
    .eq("mission_type", missionType)
    .eq("is_active", true);

  if (missionsError) {
    console.error("Missões: erro ao buscar missões", missionsError);
    return;
  }

  if (!missions || missions.length === 0) {
    console.warn("Missões: nenhuma missão ativa encontrada para", missionType);
    return;
  }

  for (const mission of missions) {
    const { data: existingMission, error: existingMissionError } =
      await supabase
        .from("user_missions")
        .select("*")
        .eq("user_id", user.id)
        .eq("mission_id", mission.id)
        .maybeSingle();

    if (existingMissionError) {
      console.error("Missões: erro ao buscar progresso", existingMissionError);
      continue;
    }

    if (existingMission?.claimed_at) {
      continue;
    }

    const currentProgress = Number(existingMission?.progress || 0);
    const targetAmount = Number(mission.target_amount || 1);
    const nextProgress = Math.min(targetAmount, currentProgress + amount);

    const completedNow =
      currentProgress < targetAmount && nextProgress >= targetAmount;

    const completedAt = completedNow
      ? new Date().toISOString()
      : existingMission?.completed_at || null;

    const payload = {
      user_id: user.id,
      mission_id: mission.id,
      progress: nextProgress,
      completed_at: completedAt,
    };

    const { error: upsertError } = await supabase
      .from("user_missions")
      .upsert(payload, {
        onConflict: "user_id,mission_id",
      });

    if (upsertError) {
      console.error("Missões: erro ao salvar progresso", upsertError);
      continue;
    }

    if (completedNow) {
      await createUserNotification({
        type: "mission_completed",
        title: "Missão pronta para resgate!",
        message: `Você completou "${mission.title}". Abra suas missões para resgatar a recompensa.`,
        metadata: {
          mission_id: mission.id,
          mission_title: mission.title,
          reward_xp: mission.reward_xp,
          ...metadata,
        },
      });
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("creator-nexus:missions-updated"));
  }
}