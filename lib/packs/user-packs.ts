import { supabase } from "@/lib/supabase/client";
import { addUserXp, type UserXpEventType } from "@/lib/xp/user-xp";
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
  duplicate?: boolean;
  duplicateXp?: number;
  creatorName?: string | null;
};

type CreatorForPack = {
  id: string;
  nickname?: string | null;
  username?: string | null;
  avatar_url?: string | null;
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

export async function giveUserPack(packType: PackType, source = "system") {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Erro ao buscar usuário para entregar pacote:", userError);
    return null;
  }

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

function getXpEventByRarity(rarity: string): UserXpEventType {
  if (rarity === "legendary") return "collect_legendary_card";
  if (rarity === "epic") return "collect_epic_card";
  if (rarity === "rare") return "collect_rare_card";
  return "collect_common_card";
}

function getDuplicateXpByRarity(rarity: string) {
  if (rarity === "legendary") return 500;
  if (rarity === "epic") return 180;
  if (rarity === "rare") return 75;
  return 25;
}

async function addDuplicateCardXp({
  userId,
  xpAmount,
  creatorId,
  creatorName,
  rarity,
  userPackId,
}: {
  userId: string;
  xpAmount: number;
  creatorId: string;
  creatorName: string | null;
  rarity: string;
  userPackId: string;
}) {
  const { error } = await supabase.rpc("add_user_xp", {
    target_user_id: userId,
    xp_value: xpAmount,
    xp_event_type: "duplicate_card",
    xp_metadata: {
      user_pack_id: userPackId,
      creator_id: creatorId,
      creator_name: creatorName,
      rarity,
      source: "pack_duplicate",
    },
  });

  if (error) {
    console.error("Erro ao adicionar XP de carta repetida:", error);
  }
}

async function getRandomCreatorForPack() {
  const { data, error } = await supabase
    .from("creator_profiles")
    .select("id, nickname, username, avatar_url")
    .limit(100);

  if (error) {
    console.error("Erro ao buscar creators para pacote:", error);
    return null;
  }

  if (!data || data.length === 0) {
    console.error("Nenhum creator encontrado para sortear carta do pacote.");
    return null;
  }

  const creatorList = data as CreatorForPack[];
  return creatorList[Math.floor(Math.random() * creatorList.length)];
}

export async function openUserPack(userPackId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Erro ao buscar usuário para abrir pacote:", userError);
    return null;
  }

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

  if (!pack?.pack_type) {
    console.error("Pacote sem pack_type válido:", userPack);
    return null;
  }

  const packType = pack.pack_type as PackType;
  const rarity = rollCardRarity(packType);
  const randomCreator = await getRandomCreatorForPack();

  if (!randomCreator) {
    return null;
  }

  const creatorName = randomCreator.nickname ?? randomCreator.username ?? "Creator";
  const now = new Date().toISOString();

  const { data: existingCard, error: existingCardError } = await supabase
    .from("user_cards")
    .select("id")
    .eq("user_id", user.id)
    .eq("creator_id", randomCreator.id)
    .maybeSingle();

  if (existingCardError) {
    console.error("Erro ao verificar carta repetida:", existingCardError);
    return null;
  }

  if (existingCard) {
    const duplicateXp = getDuplicateXpByRarity(rarity);

    const { error: packUpdateError } = await supabase
      .from("user_packs")
      .update({ opened_at: now })
      .eq("id", userPackId)
      .eq("user_id", user.id);

    if (packUpdateError) {
      console.error("Erro ao marcar pacote como aberto:", packUpdateError);
      return null;
    }

    const { error: openingError } = await supabase.from("pack_openings").insert({
      user_id: user.id,
      user_pack_id: userPackId,
      creator_id: randomCreator.id,
      card_id: existingCard.id,
      rarity,
    });

    if (openingError) {
      console.error("Erro ao registrar abertura repetida do pacote:", openingError);
    }

    await addDuplicateCardXp({
      userId: user.id,
      xpAmount: duplicateXp,
      creatorId: randomCreator.id,
      creatorName,
      rarity,
      userPackId,
    });

    await updateMissionProgress("open_pack", 1, {
      user_pack_id: userPackId,
      card_id: existingCard.id,
      creator_id: randomCreator.id,
      rarity,
      duplicate: true,
    });

    await createUserNotification({
      type: "package_opened",
      title: "Carta repetida convertida em XP!",
      message: `Você tirou ${creatorName}, mas essa carta já estava na sua coleção. Ela foi convertida em +${duplicateXp} XP.`,
      metadata: {
        user_pack_id: userPackId,
        card_id: existingCard.id,
        creator_id: randomCreator.id,
        creator_name: creatorName,
        rarity,
        pack_type: packType,
        duplicate: true,
        duplicate_xp: duplicateXp,
      },
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("creator-nexus:packs-updated"));
    }

    return {
      userPackId,
      creatorId: randomCreator.id,
      cardId: existingCard.id,
      rarity,
      duplicate: true,
      duplicateXp,
      creatorName,
    } as PackOpeningResult;
  }

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

  const { error: packUpdateError } = await supabase
    .from("user_packs")
    .update({ opened_at: now })
    .eq("id", userPackId)
    .eq("user_id", user.id);

  if (packUpdateError) {
    console.error("Erro ao marcar pacote como aberto:", packUpdateError);
    return null;
  }

  const { error: openingError } = await supabase.from("pack_openings").insert({
    user_id: user.id,
    user_pack_id: userPackId,
    creator_id: randomCreator.id,
    card_id: newCard.id,
    rarity,
  });

  if (openingError) {
    console.error("Erro ao registrar abertura do pacote:", openingError);
  }

  await addUserXp(getXpEventByRarity(rarity), {
    card_id: newCard.id,
    creator_id: randomCreator.id,
    creator_name: creatorName,
    rarity,
    source: "pack",
  });

  await updateMissionProgress("collect_card", 1, {
    card_id: newCard.id,
    creator_id: randomCreator.id,
    creator_name: creatorName,
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
    message: `Você abriu um pacote e recebeu a carta ${creatorName} (${rarity}).`,
    metadata: {
      user_pack_id: userPackId,
      card_id: newCard.id,
      creator_id: randomCreator.id,
      creator_name: creatorName,
      rarity,
      pack_type: packType,
      duplicate: false,
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
    duplicate: false,
    creatorName,
  } as PackOpeningResult;
}
