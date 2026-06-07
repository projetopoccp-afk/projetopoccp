import type { SupabaseClient } from "@supabase/supabase-js";

export async function updateCreatorProfileLevel(
  supabase: SupabaseClient,
  creatorProfileId: string,
) {
  if (!creatorProfileId) {
    return {
      profileXp: 0,
      profileLevel: 1,
    };
  }

  const { data, error } = await supabase.rpc("recalculate_creator_profile_level", {
    p_creator_profile_id: creatorProfileId,
  });

  if (error) {
    console.error("Erro ao recalcular level do creator:", error);
    return {
      profileXp: 0,
      profileLevel: 1,
    };
  }

  const result = Array.isArray(data) ? data[0] : data;

  return {
    profileXp: Number(result?.profile_xp || 0),
    profileLevel: Number(result?.profile_level || 1),
  };
}