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

  if (userError || !user) return;

  const { data: missions, error: missionsError } = await supabase
    .from("missions")
    .select("*")
    .eq("mission_type", missionType)
    .eq("is_active", true);

  if (missionsError) {
    console.error("Erro ao buscar missões:", missionsError);
    return;
  }

  for (const mission of missions || []) {
    const { data: existingMission, error: existingMissionError } =
      await supabase
        .from("user_missions")
        .select("*")
        .eq("user_id", user.id)
        .eq("mission_id", mission.id)
        .maybeSingle();

    if (existingMissionError) {
      console.error("Erro ao buscar progresso da missão:", existingMissionError);
      continue;
    }

    if (existingMission?.claimed_at) {
      continue;
    }

    const currentProgress = existingMission?.progress || 0;
    const nextProgress = Math.min(
      mission.target_amount,
      currentProgress + amount
    );

    const completedNow =
      currentProgress < mission.target_amount &&
      nextProgress >= mission.target_amount;

    if (existingMission) {
      const { error } = await supabase
        .from("user_missions")
        .update({
          progress: nextProgress,
          completed_at: completedNow
            ? new Date().toISOString()
            : existingMission.completed_at,
        })
        .eq("id", existingMission.id);

      if (error) {
        console.error("Erro ao atualizar missão:", error);
        continue;
      }
    } else {
      const { error } = await supabase.from("user_missions").insert({
        user_id: user.id,
        mission_id: mission.id,
        progress: nextProgress,
        completed_at: completedNow ? new Date().toISOString() : null,
      });

      if (error) {
        console.error("Erro ao criar progresso da missão:", error);
        continue;
      }
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
}