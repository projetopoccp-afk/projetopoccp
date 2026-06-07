import type { SupabaseClient } from "@supabase/supabase-js";

type CreatorProfileLevelInput = {
  shareCount: number;
  trendingScore: number;
  cardpocFollowers: number;
  uniqueCollectors: number;
  totalCardsCollected: number;
  rarityScore: number;
  isVerified: boolean;
  isPublic: boolean;
  isClaimed: boolean;
};

export function calculateCreatorProfileLevel(input: CreatorProfileLevelInput) {
  const profileXp =
    input.shareCount * 20 +
    input.trendingScore * 2 +
    input.cardpocFollowers * 35 +
    input.uniqueCollectors * 45 +
    input.totalCardsCollected * 12 +
    input.rarityScore +
    (input.isVerified ? 250 : 0) +
    (input.isPublic ? 50 : 0) +
    (input.isClaimed ? 150 : 0);

  const safeXp = Math.max(0, Math.floor(profileXp));
  const profileLevel = Math.max(1, Math.floor(Math.sqrt(safeXp / 120)) + 1);

  return {
    profileXp: safeXp,
    profileLevel,
  };
}

function normalizeNumber(value: unknown): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getRarityPoints(rarity: string | null | undefined): number {
  switch ((rarity || "").toLowerCase()) {
    case "legendary":
      return 180;
    case "epic":
      return 80;
    case "rare":
      return 35;
    case "common":
      return 10;
    default:
      return 0;
  }
}

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

  const { data: profile, error: profileError } = await supabase
    .from("creator_profiles")
    .select("id, share_count, trending_score, is_verified, is_public, owner_status")
    .eq("id", creatorProfileId)
    .maybeSingle();

  if (profileError || !profile) {
    return {
      profileXp: 0,
      profileLevel: 1,
    };
  }

  const { data: collectedCards } = await supabase
    .from("user_cards")
    .select("user_id, rarity")
    .eq("creator_id", creatorProfileId);

  const uniqueCollectors = new Set(
    (collectedCards || [])
      .map((card) => card.user_id)
      .filter(Boolean),
  ).size;

  const totalCardsCollected = collectedCards?.length || 0;

  const rarityScore = (collectedCards || []).reduce((total, card) => {
    return total + getRarityPoints(card.rarity);
  }, 0);

  const { count: cardpocFollowersCount } = await supabase
    .from("creator_followers")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", creatorProfileId);

  const { profileXp, profileLevel } = calculateCreatorProfileLevel({
    shareCount: normalizeNumber(profile.share_count),
    trendingScore: normalizeNumber(profile.trending_score),
    cardpocFollowers: normalizeNumber(cardpocFollowersCount),
    uniqueCollectors,
    totalCardsCollected,
    rarityScore,
    isVerified: Boolean(profile.is_verified),
    isPublic: Boolean(profile.is_public),
    isClaimed: profile.owner_status === "claimed",
  });

  await supabase
    .from("creator_profiles")
    .update({
      profile_xp: profileXp,
      profile_level: profileLevel,
      profile_level_updated_at: new Date().toISOString(),
    })
    .eq("id", creatorProfileId);

  return {
    profileXp,
    profileLevel,
  };
}