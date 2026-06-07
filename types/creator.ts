export type CreatorRarity =
  | "common"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic";

export type CreatorRank =
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Ascendant";

export type SocialPlatform =
  | "twitch"
  | "youtube"
  | "tiktok"
  | "kick"
  | "instagram"
  | "discord"
  | "x";

export type CreatorStatus =
  | "online"
  | "offline"
  | "live"
  | "trending"
  | "event";

export type CreatorSocialLink = {
  platform: SocialPlatform;
  url: string;
};

export type CreatorAchievement = {
  id: string;
  title: string;
  description: string;
};

export type CreatorTrait = {
  label: string;
  value: string;
};

export type CreatorFeaturedMoment = {
  title: string;
  description: string;
};

export type Creator = {
  id: string;
  username: string;
  nickname: string;
  title: string;
  faction: string;
  category: string;
  mainPlatform: string;
  status: CreatorStatus;
  avatarUrl: string;
  bannerUrl: string;
  popupAnimationStyle?: string | null;
  bio: string;
  description: string;
  ownerId?: string | null;
  tags: string[];
  rank: CreatorRank;
  rarity: CreatorRarity;
  aura: string;
  evolutionStage: string;
  powerScore: number;
  collectedBy: number;
  level: number;
  followers: number;
  likes: number;
  views: number;
  socials: CreatorSocialLink[];
  traits: CreatorTrait[];
  featuredMoment: CreatorFeaturedMoment;
  achievements: CreatorAchievement[];
};