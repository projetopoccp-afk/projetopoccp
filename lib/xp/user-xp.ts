import { supabase } from "@/lib/supabase/client";

export const USER_XP_REWARDS = {
  follow_creator: 25,
  share_profile: 15,
  collect_common_card: 20,
  collect_rare_card: 50,
  collect_epic_card: 120,
  collect_legendary_card: 300,
  open_daily_pack: 10,
  complete_mission: 100,
} as const;

export type UserXpEventType = keyof typeof USER_XP_REWARDS;

export function calculateLevelFromXp(xp: number) {
  return Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
}

export async function addUserXp(
  eventType: UserXpEventType,
  metadata: Record<string, unknown> = {}
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Usuário não autenticado:", userError);
    return null;
  }

  const xpAmount = USER_XP_REWARDS[eventType];

  const { data, error } = await supabase.rpc("add_user_xp", {
    target_user_id: user.id,
    xp_value: xpAmount,
    xp_event_type: eventType,
    xp_metadata: metadata,
  });

  if (error) {
    console.error("Erro ao adicionar XP:", error);
    return null;
  }

  return data?.[0] ?? null;
}