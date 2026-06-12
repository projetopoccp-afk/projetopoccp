import type { CreatorRarity } from "@/types/creator";

export type CreatorProfilePageProps = {
  username: string;
  startInEditMode?: boolean;
};

export type CreatorCardRow = {
  rarity: string | null;
  rank: string | null;
  aura: string | null;
  evolution_stage: string | null;
  level: number | null;
  power_score: number | null;
};

export type CreatorProfileRow = {
  id: string;
  user_id: string | null;
  username: string;
  nickname: string;
  title: string | null;
  category: string | null;
  status: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  popup_animation_style: string | null;
  bio: string | null;
  description: string | null;
  tags: unknown;
  is_verified: boolean | null;
  created_at: string | null;
  trending_score: number | null;
  share_count?: number | null;
  creator_cards?: CreatorCardRow[] | CreatorCardRow | null;
};

export type SocialLink = {
  platform: string;
  url: string;
};

export type CreatorProfileEditDraft = {
  nickname: string;
  title: string;
  category: string;
  avatarUrl: string;
  bannerUrl: string;
  popupAnimationStyle: string;
  bio: string;
  description: string;
  tagsText: string;
  socialLinksText: string;
};

export type AutoClip = {
  id: string;
  title: string;
  platform: "youtube" | "twitch" | "kick" | string;
  url: string;
  thumbnailUrl?: string | null;
  thumbnail_url?: string | null;
  description?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  viewCount?: number | null;
  view_count?: number | null;
};

export type PartnershipBrand = {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
};

export type CreatorPartnershipRow = {
  id: string;
  creator_id: string;
  brand_id: string | null;
  brand_name: string;
  partnership_type: string | null;
  source_platform: string | null;
  source_url: string | null;
  source_title: string | null;
  source_thumbnail: string | null;
  source_channel: string | null;
  source_published_at: string | null;
  campaign_name: string | null;
  public_description: string | null;
  website_url: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  is_active: boolean | null;
  brands?: PartnershipBrand | PartnershipBrand[] | null;
};

export type ManualPartnershipDraft = {
  brandName: string;
  partnershipType: string;
  campaignName: string;
  websiteUrl: string;
  brandLogoUrl: string;
  brandWebsiteUrl: string;
  brandDescription: string;
  publicDescription: string;
  startDate: string;
  endDate: string;
};

export type LiveStatus = {
  platform?: string;
  username?: string;
  isLive: boolean;
  title?: string;
  viewerCount?: number;
  gameName?: string;
  startedAt?: string;
  thumbnail?: string;
  url?: string;
  followerCount?: number;
  subscriberCount?: number;
  viewCount?: number;
  videoCount?: number;
  externalCount?: number;
  memberCount?: number;
  onlineMemberCount?: number;
};

export type LiveStatusMap = Partial<Record<string, LiveStatus>>;

export type CreatorLiveStatusRow = {
  id: string;
  creator_id: string;
  platform: string;
  platform_username: string | null;
  is_live: boolean | null;
  title: string | null;
  viewer_count: number | null;
  game_name: string | null;
  started_at: string | null;
  thumbnail_url: string | null;
  live_url: string | null;
  raw_payload?: Partial<LiveStatus> | null;
  last_checked_at: string | null;
  updated_at: string | null;
};
export type CreatorStats = {
  views: number;
  followers: number;
  shares: number;
};

export type CreatorCollectionStats = {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
  total: number;
  uniqueCollectors: number;
};

export type CreatorBattleCandidate = {
  id: string;
  username: string;
  nickname: string;
  avatar_url: string | null;
  share_count: number | null;
  trending_score: number | null;
  creator_cards?: CreatorCardRow[] | CreatorCardRow | null;
};

export type CreatorBattleStats = {
  views: number;
  followers: number;
  shares: number;
  globalReach: number;
  collectedCards: number;
  uniqueCollectors: number;
  highestRarity: CreatorRarity | null;
  isLive: boolean;
  liveViewers: number;
  level: number;
  powerScore: number;
};

export type VisibleYoutubeChannel = {
  url: string;
  originalIndex: number;
  username: string;
};
export type NotificationType =
  | "card_unlocked"
  | "level_up"
  | "follow_creator"
  | "share_profile"
  | "generic";
export type SupportConversationStatus =
  | "open"
  | "waiting_admin"
  | "waiting_user"
  | "resolved"
  | "closed";
export type SupportConversationType =
  | "bug"
  | "profile_correction"
  | "claim_profile"
  | "card_pack_problem"
  | "suggestion"
  | "other";

export type SupportConversationRow = {
  id: string;
  user_id: string;
  creator_id: string | null;
  type: SupportConversationType;
  subject: string;
  status: SupportConversationStatus;
  priority: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

export type SupportMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: "user" | "admin" | "system";
  message: string;
  created_at: string;
  read_at: string | null;
};
