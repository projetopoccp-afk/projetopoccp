import { supabase } from "@/lib/supabase/client";
import { addUserXp } from "@/lib/xp/user-xp";
import { createUserNotification } from "@/lib/notifications/user-notifications";
import { updateMissionProgress } from "@/lib/missions/user-missions";

export type PackType =
  | "common_pack"
  | "rare_pack"
  | "epic_pack"
  | "legendary_pack";

export type UserPack = {
  id: string;
  user_id: string;
  pack_id: string;
  source: string | null;
  opened_at: string | null;
  created_at: string;
  packs?: {
    id: string;
    name: string;
    description: string | null;
    pack_type: PackType;
    rarity: string;
    card_count: number;
    reward_xp: number;
  } | null;
};

export type PackOpeningResult = {
  userPackId: string;
  creatorId: string;
  cardId: string;
  rarity: string;
};

export async function getUserPacks() {
  const { data, error } = await supabase
    .from("user_packs")
    .select(
      `
      *,
      packs (
        id,
        name,
        description,
        pack_type,
        rarity,
        card_count,
        reward_xp
      )
    `
    )
    .is("opened_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar pacotes:", error);
    return [];
  }

  return (data || []) as UserPack[];
}

export async function giveUserPack(
  packType: PackType,
  source = "system"
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data: pack, error: packError } = await supabase
    .from("packs")
    .select("*")
    .eq("pack_type", packType)
    .eq("is_active", true)
    .single();

  if (packError || !pack) {
    console.error("Erro ao buscar pacote:", packError);
    return null;
  }

  const { data, error } = await supabase
    .from("user_packs")
    .insert({
      user_id: user.id,
      pack_id: pack.id,
      source,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Erro ao entregar pacote:", error);
    return null;
  }

  await createUserNotification({
    type: "package_received",
    title: "Você recebeu um pacote!",
    message: `Você ganhou: ${pack.name}.`,
    metadata: {
      user_pack_id: data.id,
      pack_id: pack.id,
      pack_type: pack.pack_type,
      source,
    },
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("creator-nexus:packs-updated"));
  }

  return data;
}

function rollCardRarity(packType: PackType) {
  const roll = Math.random() * 100;

  if (packType === "legendary_pack") {
    if (roll < 25) return "legendary";
    if (roll < 70) return "epic";
    if (roll < 95) return "rare";
    return "common";
  }

  if (packType === "epic_pack") {
    if (roll < 10) return "legendary";
    if (roll < 55) return "epic";
    if (roll < 90) return "rare";
    return "common";
  }

  if (packType === "rare_pack") {
    if (roll < 5) return "legendary";
    if (roll < 25) return "epic";
    if (roll < 75) return "rare";
    return "common";
  }

  if (roll < 5) return "epic";
  if (roll < 30) return "rare";
  return "common";
}

function getXpEventByRarity(rarity: string) {
  if (rarity === "legendary") return "collect_legendary_card";
  if (rarity === "epic") return "collect_epic_card";
  if (rarity === "rare") return "collect_rare_card";
  return "collect_common_card";
}

export async function openUserPack(userPackId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data: userPack, error: userPackError } = await supabase
    .from("user_packs")
    .select(
      `
      *,
      packs (
        id,
        name,
        pack_type,
        reward_xp
      )
    `
    )
    .eq("id", userPackId)
    .eq("user_id", user.id)
    .is("opened_at", null)
    .single();

  if (userPackError || !userPack) {
    console.error("Erro ao buscar pacote do usuário:", userPackError);
    return null;
  }

  const pack = userPack.packs;
  const packType = pack?.pack_type as PackType;
  const rarity = rollCardRarity(packType);

  const { data: creators, error: creatorsError } = await supabase
    .from("creators")
    .select("id, nickname, username, avatar_url")
    .eq("status", "approved")
    .limit(100);

  if (creatorsError || !creators || creators.length === 0) {
    console.error("Erro ao buscar creators para pacote:", creatorsError);
    return null;
  }

  const randomCreator =
    creators[Math.floor(Math.random() * creators.length)];

  const { data: newCard, error: cardError } = await supabase
    .from("user_cards")
    .insert({
      user_id: user.id,
      creator_id: randomCreator.id,
      rarity,
      source: "pack",
    })
    .select("*")
    .single();

  if (cardError || !newCard) {
    console.error("Erro ao criar carta do pacote:", cardError);
    return null;
  }

  const now = new Date().toISOString();

  await supabase
    .from("user_packs")
    .update({ opened_at: now })
    .eq("id", userPackId)
    .eq("user_id", user.id);

  await supabase.from("pack_openings").insert({
    user_id: user.id,
    user_pack_id: userPackId,
    creator_id: randomCreator.id,
    card_id: newCard.id,
    rarity,
  });

  await addUserXp(getXpEventByRarity(rarity), {
    card_id: newCard.id,
    creator_id: randomCreator.id,
    rarity,
    source: "pack",
  });

  await updateMissionProgress("collect_card", 1, {
    card_id: newCard.id,
    creator_id: randomCreator.id,
    rarity,
    source: "pack",
  });

  await updateMissionProgress("open_pack", 1, {
    user_pack_id: userPackId,
    card_id: newCard.id,
    rarity,
  });

  await createUserNotification({
    type: "package_opened",
    title: "Pacote aberto!",
    message: `Você abriu um pacote e recebeu uma carta ${rarity}.`,
    metadata: {
      user_pack_id: userPackId,
      card_id: newCard.id,
      creator_id: randomCreator.id,
      rarity,
      pack_type: packType,
    },
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("creator-nexus:packs-updated"));
    window.dispatchEvent(new Event("creator-nexus:collection-updated"));
  }

  return {
    userPackId,
    creatorId: randomCreator.id,
    cardId: newCard.id,
    rarity,
  } as PackOpeningResult;
}