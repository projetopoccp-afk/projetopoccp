"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  Eye,
  Gift,
  Globe2,
  MessageCircle,
  Send,
  Plus,
  Radio,
  Share2,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Trash2,
  UserPlus,
  Users,
  WifiOff,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { CREATOR_POPUP_IMAGE_EFFECT_STYLES } from "@/components/creator/CreatorPopupImageEffects";
import { GlowBackground } from "@/components/effects/GlowBackground";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { LiveDropsModal } from "@/components/modals/LiveDropsModal";
import { translate } from "@/lib/i18n/translate";
import { supabase } from "@/lib/supabase/client";
import { updateMissionProgress } from "@/lib/missions/user-missions";
import type { Creator, CreatorRarity, CreatorStatus } from "@/types/creator";
import { SupportChatModal } from "./profile/CreatorSupportChatModal";
import { useCreatorClips } from "./profile/useCreatorClips";
import { useCreatorLiveStatus } from "./profile/useCreatorLiveStatus";
import { useCreatorClipSections } from "./profile/useCreatorClipSections";
import { useCreatorPartnershipsView } from "./profile/useCreatorPartnershipsView";
import { useCreatorLivePlatformItems } from "./profile/useCreatorLivePlatformItems";
import { useCreatorSocialDropdownItems } from "./profile/useCreatorSocialDropdownItems";
import { CreatorPartnershipsSection } from "./profile/CreatorPartnershipsSection";
import { CreatorClipsSection } from "./profile/CreatorClipsSection";
import { CreatorLiveBanner, CreatorLivePlatformsModal } from "./profile/CreatorLivePanel";
import { CreatorSocialDropdown } from "./profile/CreatorSocialDropdown";
import { CreatorProfileHeroActions } from "./profile/CreatorProfileHeroActions";
import { CreatorProfileStatsGrid } from "./profile/CreatorProfileStatsGrid";
import { CreatorBattleCta } from "./profile/CreatorBattleCta";
import { CreatorCardPanel } from "./profile/CreatorCardPanel";
import { CreatorEditProfileModal } from "./profile/CreatorEditProfileModal";
import { CreatorEditFloatingSaveBar } from "./profile/CreatorEditFloatingSaveBar";
import { CreatorBattleModal } from "./profile/CreatorBattleModal";
import { CreatorClaimModal } from "./profile/CreatorClaimModal";
import {
  translateExisting,
  mapCreatorLiveStatusRowToLiveStatus,
  SOCIAL_PLATFORM_OPTIONS,
  RARITY_SHOWCASE_CYCLE,
  RARITY_SHOWCASE_INTERVAL,
  EMPTY_COLLECTION_STATS,
  buildCreatorCollectionStats,
  getHighestRarityFromStats,
  getCreatorCardLevel,
  getCreatorCardPower,
  normalizeCreatorTags,
  getCreatorCard,
  formatNumber,
  formatProfileDate,
  getPartnershipDisplayName,
  getPartnershipTimestamp,
  getPartnershipLogo,
  getPartnershipWebsite,
  getPartnershipTypeLabel,
  createBrandSlug,
  createEmptyManualPartnershipDraft,
  getPlatformLiveStatus,
  getNormalizedYoutubeChannels,
  getYoutubeChannelFallbackTitle,
  getYoutubeExternalReachFromLiveStatus,
  getCreatorExternalReachFromLiveStatus,
  normalizeCreatorStatus,
  normalizeCreatorRarity,
  normalizeCreatorRank,
  createProfileEditDraft,
  parseEditTags,
  parseEditSocialLinks,
  getEditSocialLinkRows,
  serializeEditSocialLinks,
  normalizeCreatorSocials,
  hasXpEvent,
  addXpAndNotifyLevelUp,
  createUserNotification
} from "./profile/creator-profile-shared";
import type {
  CreatorProfilePageProps,
  CreatorProfileRow,
  SocialLink,
  CreatorProfileEditDraft,
  CreatorPartnershipRow,
  ManualPartnershipDraft,
  LiveStatusMap,
  CreatorLiveStatusRow,
  CreatorStats,
  CreatorCollectionStats,
  CreatorBattleCandidate,
  CreatorBattleStats
} from "./profile/creator-profile-shared";


const CreatorStatsModal = dynamic(
  () =>
    import("@/components/creator/CreatorStatsModal").then(
      (mod) => mod.CreatorStatsModal,
    ),
  { ssr: false },
);

export function CreatorProfilePage({
  username,
  startInEditMode = false,
}: CreatorProfilePageProps) {
  const { t } = useLanguage();
  const router = useRouter();

  const [profile, setProfile] = useState<CreatorProfileRow | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [partnerships, setPartnerships] = useState<CreatorPartnershipRow[]>([]);
  const [manualPartnershipDraft, setManualPartnershipDraft] =
    useState<ManualPartnershipDraft>(() => createEmptyManualPartnershipDraft());
  const [manualPartnershipSaving, setManualPartnershipSaving] = useState(false);
  const [manualPartnershipError, setManualPartnershipError] = useState<
    string | null
  >(null);
  const [stats, setStats] = useState<CreatorStats>({
    views: 0,
    followers: 0,
    shares: 0,
  });
  const [collectionStats, setCollectionStats] =
    useState<CreatorCollectionStats>(EMPTY_COLLECTION_STATS);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<CreatorProfileEditDraft | null>(
    null,
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [youtubeChannelsOpen, setYoutubeChannelsOpen] = useState(false);
  const [livePlatformsOpen, setLivePlatformsOpen] = useState(false);
  const [socialLinksOpen, setSocialLinksOpen] = useState(false);
  const [popupEffectDropdownOpen, setPopupEffectDropdownOpen] = useState(false);
  const [activeClipPlatform, setActiveClipPlatform] = useState<string>("");
  const socialLinksDropdownRef = useRef<HTMLDivElement | null>(null);
  const popupEffectDropdownRef = useRef<HTMLDivElement | null>(null);
  const [profileLinkCopied, setProfileLinkCopied] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimPlatform, setClaimPlatform] = useState("youtube");
  const [claimUrl, setClaimUrl] = useState("");
  const [claimImageUsageConsent, setClaimImageUsageConsent] = useState(false);
  const [claimSending, setClaimSending] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [showcaseRarityIndex, setShowcaseRarityIndex] = useState(0);
  const [supportChatOpen, setSupportChatOpen] = useState(false);
  const [liveDropsOpen, setLiveDropsOpen] = useState(false);
  const [creatorStatsOpen, setCreatorStatsOpen] = useState(false);
  const [profileEditModalOpen, setProfileEditModalOpen] = useState(startInEditMode);
  const [creatorPanelOpen, setCreatorPanelOpen] = useState(false);
  const creatorPanelDropdownRef = useRef<HTMLDivElement | null>(null);
  const [battleCandidates, setBattleCandidates] = useState<CreatorBattleCandidate[]>([]);
  const [selectedBattleCreatorId, setSelectedBattleCreatorId] = useState("");
  const [battleStats, setBattleStats] = useState<CreatorBattleStats | null>(null);
  const [battleLoading, setBattleLoading] = useState(false);
  const [battleModalOpen, setBattleModalOpen] = useState(false);
  const [battleStarted, setBattleStarted] = useState(false);
  const [revealedBattleRows, setRevealedBattleRows] = useState(0);
  const [battleSearchQuery, setBattleSearchQuery] = useState("");

  const { liveStatus, liveStatusLoading } = useCreatorLiveStatus(profile, socialLinks);
  const { clips, clipsLoading } = useCreatorClips(profile, socialLinks);

  const decodedUsername = useMemo(() => {
    return decodeURIComponent(username || "")
      .replace("@", "")
      .trim();
  }, [username]);

  const creatorPublicPath = useMemo(() => {
    const targetUsername = profile?.username || decodedUsername || username;

    return `/creator/${encodeURIComponent(targetUsername)}`;
  }, [decodedUsername, profile?.username, username]);

  const claimCode = useMemo(() => {
    const source = profile?.id || decodedUsername || username || "cardpoc";

    return `CDP-${source
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 3)
      .toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  }, [decodedUsername, profile?.id, username]);

  useEffect(() => {
    let intervalId: number | null = null;

    const startRotation = () => {
      if (intervalId !== null) return;

      intervalId = window.setInterval(() => {
        setShowcaseRarityIndex(
          (current) => (current + 1) % RARITY_SHOWCASE_CYCLE.length,
        );
      }, RARITY_SHOWCASE_INTERVAL);
    };

    const stopRotation = () => {
      if (intervalId === null) return;

      window.clearInterval(intervalId);
      intervalId = null;
    };

    const syncRotationWithVisibility = () => {
      if (document.hidden) {
        stopRotation();
        return;
      }

      startRotation();
    };

    syncRotationWithVisibility();
    document.addEventListener("visibilitychange", syncRotationWithVisibility);

    return () => {
      document.removeEventListener("visibilitychange", syncRotationWithVisibility);
      stopRotation();
    };
  }, []);

  useEffect(() => {
    if (!socialLinksOpen && !creatorPanelOpen && !popupEffectDropdownOpen) return;

    function handleOutsideInteraction(event: MouseEvent | TouchEvent) {
      const target = event.target;

      if (!(target instanceof Node)) return;

      if (
        socialLinksOpen &&
        !socialLinksDropdownRef.current?.contains(target)
      ) {
        setSocialLinksOpen(false);
      }

      if (
        creatorPanelOpen &&
        !creatorPanelDropdownRef.current?.contains(target)
      ) {
        setCreatorPanelOpen(false);
      }

      if (
        popupEffectDropdownOpen &&
        !popupEffectDropdownRef.current?.contains(target)
      ) {
        setPopupEffectDropdownOpen(false);
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSocialLinksOpen(false);
        setCreatorPanelOpen(false);
        setPopupEffectDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideInteraction);
    document.addEventListener("touchstart", handleOutsideInteraction);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleOutsideInteraction);
      document.removeEventListener("touchstart", handleOutsideInteraction);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [creatorPanelOpen, popupEffectDropdownOpen, socialLinksOpen]);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) {
          setCurrentUserId(null);
          setCurrentUserIsAdmin(false);
        }

        return;
      }

      const { data: accountProfile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setCurrentUserId(user.id);
        setCurrentUserIsAdmin(Boolean(accountProfile?.is_admin));
      }
    }

    loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCreatorProfile() {
      setLoading(true);

      const { data, error } = await supabase
        .from("creator_profiles")
        .select(
          `
          id,
          user_id,
          username,
          nickname,
          title,
          category,
          status,
          avatar_url,
          banner_url,
          popup_animation_style,
          bio,
          description,
          tags,
          is_verified,
          created_at,
          trending_score,
          share_count,
          profile_level,
          profile_xp,
          creator_cards (
            rarity,
            rank,
            aura,
            evolution_stage,
            level,
            power_score
          )
        `,
        )
        .eq("is_public", true)
        .ilike("username", decodedUsername)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        setProfile(null);
        setSocialLinks([]);
        setPartnerships([]);
        setStats({
          views: 0,
          followers: 0,
          shares: 0,
        });
        setCollectionStats(EMPTY_COLLECTION_STATS);
        setLoading(false);
        return;
      }

      const typedProfile = data as CreatorProfileRow;

      setProfile(typedProfile);

      const [
        { data: socialData },
        { count: viewCount },
        { count: followerCount },
        { data: partnershipData },
        { data: collectionData },
      ] = await Promise.all([
        supabase
          .from("creator_social_links")
          .select("platform, url")
          .eq("creator_id", typedProfile.id)
          .order("platform", { ascending: true }),
        supabase
          .from("creator_views")
          .select("id", { count: "exact", head: true })
          .eq("creator_id", typedProfile.id),
        supabase
          .from("creator_followers")
          .select("id", { count: "exact", head: true })
          .eq("creator_id", typedProfile.id),
        supabase
          .from("creator_partnerships")
          .select(
            `
            id,
            creator_id,
            brand_id,
            brand_name,
            partnership_type,
            source_platform,
            source_url,
            source_title,
            source_thumbnail,
            source_channel,
            source_published_at,
            campaign_name,
            public_description,
            website_url,
            start_date,
            end_date,
            status,
            is_active,
            brands (
              id,
              name,
              slug,
              logo_url,
              website_url,
              description
            )
          `,
          )
          .eq("creator_id", typedProfile.id)
          .eq("is_active", true)
          .in("status", ["verified", "manual"]),
        supabase
          .from("user_cards")
          .select("rarity, user_id")
          .eq("creator_id", typedProfile.id),
      ]);

      if (cancelled) return;

      setSocialLinks((socialData || []) as SocialLink[]);
      setPartnerships(
        ((partnershipData || []) as CreatorPartnershipRow[]).sort(
          (partnershipA, partnershipB) =>
            getPartnershipTimestamp(partnershipB) -
            getPartnershipTimestamp(partnershipA),
        ),
      );
      setStats({
        views: viewCount || 0,
        followers: followerCount || 0,
        shares: typedProfile.share_count || 0,
      });
      setCollectionStats(
        buildCreatorCollectionStats(
          (collectionData || []) as Array<{ rarity?: string | null; user_id?: string | null }>,
        ),
      );
      setLoading(false);
    }

    if (decodedUsername) {
      loadCreatorProfile();
    } else {
      setProfile(null);
      setPartnerships([]);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [decodedUsername]);

  useEffect(() => {
    if (!profile) {
      setEditDraft(null);
      return;
    }

    setEditDraft(createProfileEditDraft(profile, socialLinks));
  }, [profile, socialLinks]);

  useEffect(() => {
    let cancelled = false;
    const currentCreatorId = profile?.id;

    async function loadFollowState() {
      if (!currentCreatorId || !currentUserId) {
        if (!cancelled) {
          setIsFollowing(false);
        }
        return;
      }

      const { data } = await supabase
        .from("creator_followers")
        .select("id")
        .eq("creator_id", currentCreatorId)
        .eq("user_id", currentUserId)
        .maybeSingle();

      if (!cancelled) {
        setIsFollowing(Boolean(data));
      }
    }

    loadFollowState();

    return () => {
      cancelled = true;
    };
  }, [profile?.id, currentUserId]);

  const card = getCreatorCard(profile);
  const nickname =
    profile?.nickname ||
    decodedUsername ||
    translate(t, "creatorProfileFallbackName", "Criador Cardpoc");
  const title =
    profile?.title ||
    translate(t, "creatorProfileDefaultTitle", "Criador de conteúdo");
  const category =
    profile?.category ||
    translate(t, "creatorProfileDefaultCategory", "Criador");
  const bio =
    profile?.bio ||
    translate(
      t,
      "creatorProfileDefaultBio",
      "Perfil público de criador aprovado no Cardpoc.",
    );
  const description =
    profile?.description ||
    translate(
      t,
      "creatorProfileDefaultDescription",
      "Acompanhe cartas colecionáveis, presença digital, redes sociais e momentos em destaque deste criador no Cardpoc.",
    );
  const rarity = card?.rarity || "common";
  const tags = normalizeCreatorTags(profile?.tags);
  const visibleTags = tags;
  const externalReach = getCreatorExternalReachFromLiveStatus(liveStatus);
  const highestCollectedRarity = getHighestRarityFromStats(collectionStats);
  const cardLevel = getCreatorCardLevel(card, profile);
  const cardPowerScore = getCreatorCardPower(card);
  const twitchStatus = getPlatformLiveStatus(liveStatus, "twitch");
  const kickStatus = getPlatformLiveStatus(liveStatus, "kick");
  const youtubeStatus = getPlatformLiveStatus(liveStatus, "youtube");
  const discordStatus = getPlatformLiveStatus(liveStatus, "discord");
  const visibleYoutubeChannels = getNormalizedYoutubeChannels(
    socialLinks
      .filter((social) => social.platform.toLowerCase() === "youtube")
      .map((social) => social.url),
  );
  const youtubeExternalReach =
    getYoutubeExternalReachFromLiveStatus(liveStatus);
  const youtubeChannelItems = visibleYoutubeChannels.map((channel, index) => {
    const channelStatus = getPlatformLiveStatus(
      liveStatus,
      `youtube:${channel.originalIndex}`,
    );

    const fallbackTitle = getYoutubeChannelFallbackTitle(
      channel,
      `${translate(t, "creatorPopupYoutubeChannelFallback", "Canal")} ${index + 1}`,
    );

    return {
      url: channelStatus?.url || channel.url,
      title: channelStatus?.title || fallbackTitle,
      thumbnail: channelStatus?.thumbnail,
      subscriberCount:
        channelStatus?.subscriberCount ?? channelStatus?.externalCount ?? 0,
    };
  });
  const isLive = Boolean(twitchStatus?.isLive || kickStatus?.isLive);
  const currentCreatorBattleStats: CreatorBattleStats = {
    views: stats.views,
    followers: stats.followers,
    shares: stats.shares,
    globalReach: externalReach,
    collectedCards: collectionStats.total,
    uniqueCollectors: collectionStats.uniqueCollectors,
    highestRarity: highestCollectedRarity,
    isLive,
    liveViewers: Object.values(liveStatus).reduce(
      (total, status) => total + (status?.isLive ? Number(status.viewerCount || 0) : 0),
      0,
    ),
    level: cardLevel,
    powerScore: cardPowerScore,
  };
  const isOwner = Boolean(
    profile?.user_id && currentUserId === profile.user_id,
  );
  const canManageProfile = Boolean(isOwner || currentUserIsAdmin);
  const profileUrl = `/creator/${encodeURIComponent(
    profile?.username || decodedUsername,
  )}`;

  useEffect(() => {
    let cancelled = false;

    async function loadBattleCandidates() {
      if (!profile?.id) {
        setBattleCandidates([]);
        return;
      }

      const { data } = await supabase
        .from("creator_profiles")
        .select(
          `
          id,
          username,
          nickname,
          avatar_url,
          share_count,
          trending_score,
          creator_cards (
            rarity,
            rank,
            aura,
            evolution_stage,
            level,
            power_score
          )
        `,
        )
        .eq("is_public", true)
        .neq("id", profile.id)
        .order("nickname", { ascending: true });

      if (!cancelled) {
        setBattleCandidates((data || []) as CreatorBattleCandidate[]);
      }
    }

    loadBattleCandidates();

    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadBattleStats() {
      const selectedCreator = battleCandidates.find(
        (candidate) => candidate.id === selectedBattleCreatorId,
      );

      if (!selectedCreator) {
        setBattleStats(null);
        return;
      }

      setBattleLoading(true);

      const [
        { count: viewCount },
        { count: followerCount },
        { data: collectionRows },
        { data: liveRows },
      ] = await Promise.all([
        supabase
          .from("creator_views")
          .select("id", { count: "exact", head: true })
          .eq("creator_id", selectedCreator.id),
        supabase
          .from("creator_followers")
          .select("id", { count: "exact", head: true })
          .eq("creator_id", selectedCreator.id),
        supabase
          .from("user_cards")
          .select("rarity, user_id")
          .eq("creator_id", selectedCreator.id),
        supabase
          .from("creator_live_status")
          .select("id, creator_id, platform, platform_username, is_live, title, viewer_count, game_name, started_at, thumbnail_url, live_url, raw_payload, last_checked_at, updated_at")
          .eq("creator_id", selectedCreator.id),
      ]);

      if (cancelled) return;

      const selectedCollectionStats = buildCreatorCollectionStats(
        (collectionRows || []) as Array<{ rarity?: string | null; user_id?: string | null }>,
      );
      const selectedLiveStatus = ((liveRows || []) as CreatorLiveStatusRow[]).reduce<LiveStatusMap>(
        (accumulator, row) => {
          accumulator[row.platform] = mapCreatorLiveStatusRowToLiveStatus(row);
          return accumulator;
        },
        {},
      );
      const selectedCard = Array.isArray(selectedCreator.creator_cards)
        ? selectedCreator.creator_cards[0] || null
        : selectedCreator.creator_cards || null;

      setBattleStats({
        views: viewCount || 0,
        followers: followerCount || 0,
        shares: Number(selectedCreator.share_count || 0),
        globalReach: getCreatorExternalReachFromLiveStatus(selectedLiveStatus),
        collectedCards: selectedCollectionStats.total,
        uniqueCollectors: selectedCollectionStats.uniqueCollectors,
        highestRarity: getHighestRarityFromStats(selectedCollectionStats),
        isLive: Object.values(selectedLiveStatus).some((status) => Boolean(status?.isLive)),
        liveViewers: Object.values(selectedLiveStatus).reduce(
          (total, status) => total + (status?.isLive ? Number(status.viewerCount || 0) : 0),
          0,
        ),
        level: getCreatorCardLevel(selectedCard, profile),
        powerScore: getCreatorCardPower(selectedCard),
      });
      setBattleLoading(false);
    }

    loadBattleStats().finally(() => {
      if (!cancelled) {
        setBattleLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [battleCandidates, selectedBattleCreatorId]);

  const selectedBattleCreator = battleCandidates.find(
    (candidate) => candidate.id === selectedBattleCreatorId,
  );

  const filteredBattleCandidates = battleCandidates.filter((candidate) => {
    const query = battleSearchQuery.trim().toLowerCase();
    if (!query) return true;

    return `${candidate.nickname || ""} ${candidate.username || ""}`
      .toLowerCase()
      .includes(query);
  });

  const openBattleModal = () => {
    setBattleStarted(false);
    setRevealedBattleRows(0);
    setBattleModalOpen(true);
  };

  const closeBattleModal = () => {
    setBattleModalOpen(false);
    setBattleStarted(false);
    setRevealedBattleRows(0);
  };

  const startBattleAnimation = () => {
    if (!selectedBattleCreator || !battleStats || battleLoading) return;

    setRevealedBattleRows(0);
    setBattleStarted(true);
  };

  const battleRows = battleStats
    ? [
        {
          key: "followers",
          label: translate(t, "creatorProfileBattleFollowers", "Seguidores Cardpoc"),
          current: currentCreatorBattleStats.followers,
          opponent: battleStats.followers,
        },
        {
          key: "views",
          label: translate(t, "creatorProfileBattleViews", "Visualizações"),
          current: currentCreatorBattleStats.views,
          opponent: battleStats.views,
        },
        {
          key: "globalReach",
          label: translate(t, "creatorProfileBattleGlobalReach", "Alcance global"),
          current: currentCreatorBattleStats.globalReach,
          opponent: battleStats.globalReach,
        },
        {
          key: "collectedCards",
          label: translate(t, "creatorProfileBattleCards", "Cartas coletadas"),
          current: currentCreatorBattleStats.collectedCards,
          opponent: battleStats.collectedCards,
        },
        {
          key: "shares",
          label: translate(t, "creatorProfileBattleShares", "Compartilhamentos"),
          current: currentCreatorBattleStats.shares,
          opponent: battleStats.shares,
        },
        {
          key: "level",
          label: translate(t, "creatorProfileBattleLevel", "Nível da carta"),
          current: currentCreatorBattleStats.level,
          opponent: battleStats.level,
        },
      ]
    : [];

  useEffect(() => {
    if (!battleModalOpen || !battleStarted || battleRows.length === 0) return;

    setRevealedBattleRows(0);

    let interval: number | null = null;

    const stopBattleAnimation = () => {
      if (interval === null) return;

      window.clearInterval(interval);
      interval = null;
    };

    const startBattleAnimation = () => {
      if (interval !== null) return;

      interval = window.setInterval(() => {
        setRevealedBattleRows((current) => {
          if (current >= battleRows.length) {
            stopBattleAnimation();
            return current;
          }

          return current + 1;
        });
      }, 620);
    };

    const syncBattleAnimationWithVisibility = () => {
      if (document.hidden) {
        stopBattleAnimation();
        return;
      }

      startBattleAnimation();
    };

    syncBattleAnimationWithVisibility();
    document.addEventListener("visibilitychange", syncBattleAnimationWithVisibility);

    return () => {
      document.removeEventListener("visibilitychange", syncBattleAnimationWithVisibility);
      stopBattleAnimation();
    };
  }, [battleModalOpen, battleStarted, battleRows.length]);

  const visibleBattleRows = battleStarted
    ? battleRows.slice(0, revealedBattleRows)
    : [];
  const battleAnimationComplete =
    battleStarted && battleRows.length > 0 && revealedBattleRows >= battleRows.length;
  const visibleBattleScore = visibleBattleRows.reduce(
    (score, row) => {
      if (row.current > row.opponent) return { ...score, current: score.current + 1 };
      if (row.opponent > row.current) return { ...score, opponent: score.opponent + 1 };
      return { ...score, draws: score.draws + 1 };
    },
    { current: 0, opponent: 0, draws: 0 },
  );
  const battleScore = battleRows.reduce(
    (score, row) => {
      if (row.current > row.opponent) return { ...score, current: score.current + 1 };
      if (row.opponent > row.current) return { ...score, opponent: score.opponent + 1 };
      return { ...score, draws: score.draws + 1 };
    },
    { current: 0, opponent: 0, draws: 0 },
  );
  const battleFinalWinner =
    battleScore.current > battleScore.opponent
      ? "current"
      : battleScore.opponent > battleScore.current
        ? "opponent"
        : "draw";

  const {
    clipPlatformSections,
    selectedClipPlatform,
    selectedPlatformClips,
  } = useCreatorClipSections({
    clips,
    activeClipPlatform,
    setActiveClipPlatform,
  });

  const { visiblePartnerships, partnershipHistoryCount } =
    useCreatorPartnershipsView({ partnerships });

  async function refreshCreatorProfile() {
    if (!decodedUsername) return;

    const { data, error } = await supabase
      .from("creator_profiles")
      .select(
        `
        id,
        user_id,
        username,
        nickname,
        title,
        category,
        status,
        avatar_url,
        banner_url,
        popup_animation_style,
        bio,
        description,
        tags,
        is_verified,
        created_at,
        trending_score,
        share_count,
        creator_cards (
          rarity,
          rank,
          aura,
          evolution_stage,
          level,
          power_score
        )
      `,
      )
      .eq("is_public", true)
      .ilike("username", decodedUsername)
      .maybeSingle();

    if (error || !data) return;

    const typedProfile = data as CreatorProfileRow;
    setProfile(typedProfile);

    const [
      { data: socialData },
      { count: viewCount },
      { count: followerCount },
      { data: partnershipData },
    ] = await Promise.all([
      supabase
        .from("creator_social_links")
        .select("platform, url")
        .eq("creator_id", typedProfile.id)
        .order("platform", { ascending: true }),
      supabase
        .from("creator_views")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", typedProfile.id),
      supabase
        .from("creator_followers")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", typedProfile.id),
      supabase
        .from("creator_partnerships")
        .select(
          `
          id,
          creator_id,
          brand_id,
          brand_name,
          partnership_type,
          source_platform,
          source_url,
          source_title,
          source_thumbnail,
          source_channel,
          source_published_at,
          campaign_name,
          public_description,
          website_url,
          start_date,
          end_date,
          status,
          is_active,
          brands (
            id,
            name,
            slug,
            logo_url,
            website_url,
            description
          )
        `,
        )
        .eq("creator_id", typedProfile.id)
        .eq("is_active", true)
        .in("status", ["verified", "manual"]),
    ]);

    setSocialLinks((socialData || []) as SocialLink[]);
    setPartnerships(
      ((partnershipData || []) as CreatorPartnershipRow[]).sort(
        (partnershipA, partnershipB) =>
          getPartnershipTimestamp(partnershipB) -
          getPartnershipTimestamp(partnershipA),
      ),
    );
    setStats({
      views: viewCount || 0,
      followers: followerCount || 0,
      shares: typedProfile.share_count || 0,
    });
  }

  function handleEditDraftChange(
    field: keyof CreatorProfileEditDraft,
    value: string,
  ) {
    setEditDraft((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current,
    );
    setProfileSaveError(null);
  }

  function handleEditSocialLinkChange(
    index: number,
    field: keyof SocialLink,
    value: string,
  ) {
    setEditDraft((current) => {
      if (!current) return current;

      const rows = getEditSocialLinkRows(current.socialLinksText);
      const nextRows = rows.map((social, socialIndex) =>
        socialIndex === index
          ? {
              ...social,
              [field]: value,
            }
          : social,
      );

      return {
        ...current,
        socialLinksText: serializeEditSocialLinks(nextRows),
      };
    });
    setProfileSaveError(null);
  }

  function handleAddEditSocialLink() {
    setEditDraft((current) => {
      if (!current) return current;

      const rows = getEditSocialLinkRows(current.socialLinksText);

      return {
        ...current,
        socialLinksText: serializeEditSocialLinks([
          ...rows,
          { platform: "youtube", url: "" },
        ]),
      };
    });
    setProfileSaveError(null);
  }

  function handleRemoveEditSocialLink(index: number) {
    setEditDraft((current) => {
      if (!current) return current;

      const rows = getEditSocialLinkRows(current.socialLinksText);
      const nextRows = rows.filter((_, socialIndex) => socialIndex !== index);

      return {
        ...current,
        socialLinksText: serializeEditSocialLinks(nextRows),
      };
    });
    setProfileSaveError(null);
  }

  function handleCancelEditMode() {
    if (profile) {
      setEditDraft(createProfileEditDraft(profile, socialLinks));
    }

    setProfileSaveError(null);
    setIsEditing(false);
    setProfileEditModalOpen(false);

    if (startInEditMode) {
      router.replace(creatorPublicPath);
    }
  }

  function handleOpenProfileEditModal() {
    if (!profile || !canManageProfile) return;

    setEditDraft(createProfileEditDraft(profile, socialLinks));
    setProfileSaveError(null);
    setPopupEffectDropdownOpen(false);
    setProfileEditModalOpen(true);
  }

  function handleCloseProfileEditModal() {
    if (isSavingProfile) return;

    if (profile) {
      setEditDraft(createProfileEditDraft(profile, socialLinks));
    }

    setProfileSaveError(null);
    setPopupEffectDropdownOpen(false);
    setProfileEditModalOpen(false);
  }

  function handleManualPartnershipDraftChange(
    field: keyof ManualPartnershipDraft,
    value: string,
  ) {
    setManualPartnershipDraft((current) => ({
      ...current,
      [field]: value,
    }));
    setManualPartnershipError(null);
  }

  async function handleAddManualPartnership() {
    if (!profile || !currentUserId || !canManageProfile) return;

    const brandName = manualPartnershipDraft.brandName.trim();

    if (!brandName) {
      setManualPartnershipError(
        translate(
          t,
          "creatorProfileManualPartnershipRequired",
          "Informe o nome da marca para adicionar a parceria.",
        ),
      );
      return;
    }

    setManualPartnershipSaving(true);
    setManualPartnershipError(null);

    const brandLogoUrl = manualPartnershipDraft.brandLogoUrl.trim();
    const brandWebsiteUrl = manualPartnershipDraft.brandWebsiteUrl.trim();
    const brandDescription = manualPartnershipDraft.brandDescription.trim();
    const partnershipUrl = manualPartnershipDraft.websiteUrl.trim();

    const { data: matchingBrand } = await supabase
      .from("brands")
      .select("id, name, logo_url, website_url, description")
      .ilike("name", brandName)
      .maybeSingle();

    let brandId = matchingBrand?.id || null;

    if (matchingBrand?.id) {
      const brandUpdates: Record<string, string> = {};

      if (brandLogoUrl && brandLogoUrl !== (matchingBrand.logo_url || "")) {
        brandUpdates.logo_url = brandLogoUrl;
      }

      if (
        brandWebsiteUrl &&
        brandWebsiteUrl !== (matchingBrand.website_url || "")
      ) {
        brandUpdates.website_url = brandWebsiteUrl;
      }

      if (
        brandDescription &&
        brandDescription !== (matchingBrand.description || "")
      ) {
        brandUpdates.description = brandDescription;
      }

      if (Object.keys(brandUpdates).length > 0) {
        await supabase
          .from("brands")
          .update(brandUpdates)
          .eq("id", matchingBrand.id);
      }
    } else if (brandLogoUrl || brandWebsiteUrl || brandDescription) {
      const { data: createdBrand } = await supabase
        .from("brands")
        .insert({
          name: brandName,
          slug: createBrandSlug(brandName),
          logo_url: brandLogoUrl || null,
          website_url: brandWebsiteUrl || null,
          description: brandDescription || null,
        })
        .select("id")
        .maybeSingle();

      brandId = createdBrand?.id || null;
    }

    const { error } = await supabase.from("creator_partnerships").insert({
      creator_id: profile.id,
      brand_id: brandId,
      brand_name: brandName,
      partnership_type: manualPartnershipDraft.partnershipType || "sponsorship",
      source_platform: "manual",
      source_url: partnershipUrl || brandWebsiteUrl || null,
      website_url: partnershipUrl || brandWebsiteUrl || null,
      campaign_name: manualPartnershipDraft.campaignName.trim() || null,
      public_description:
        manualPartnershipDraft.publicDescription.trim() || null,
      start_date: manualPartnershipDraft.startDate || null,
      end_date: manualPartnershipDraft.endDate || null,
      confidence_score: 100,
      detection_reason: "manual_creator_submission",
      status: "manual",
      is_active: true,
      created_by: currentUserId,
    });

    if (error) {
      setManualPartnershipSaving(false);
      setManualPartnershipError(error.message);
      return;
    }

    setManualPartnershipDraft(createEmptyManualPartnershipDraft());
    setManualPartnershipSaving(false);
    await refreshCreatorProfile();
  }

  async function handleSaveProfileEdit() {
    if (!profile || !editDraft || !canManageProfile) return;

    setIsSavingProfile(true);
    setProfileSaveError(null);

    const nextTags = parseEditTags(editDraft.tagsText);
    const nextSocialLinks = parseEditSocialLinks(editDraft.socialLinksText);

    const { error } = await supabase
      .from("creator_profiles")
      .update({
        nickname: editDraft.nickname.trim() || profile.nickname,
        title: editDraft.title.trim() || null,
        category: editDraft.category.trim() || null,
        avatar_url: editDraft.avatarUrl.trim() || null,
        banner_url: editDraft.bannerUrl.trim() || null,
        popup_animation_style: editDraft.popupAnimationStyle || "none",
        bio: editDraft.bio.trim() || null,
        description: editDraft.description.trim() || null,
        tags: nextTags,
      })
      .eq("id", profile.id);

    if (error) {
      setIsSavingProfile(false);
      setProfileSaveError(error.message);
      return;
    }

    const { error: deleteSocialLinksError } = await supabase
      .from("creator_social_links")
      .delete()
      .eq("creator_id", profile.id);

    if (deleteSocialLinksError) {
      setIsSavingProfile(false);
      setProfileSaveError(deleteSocialLinksError.message);
      return;
    }

    if (nextSocialLinks.length > 0) {
      const { error: insertSocialLinksError } = await supabase
        .from("creator_social_links")
        .insert(
          nextSocialLinks.map((social) => ({
            creator_id: profile.id,
            platform: social.platform,
            url: social.url,
          })),
        );

      if (insertSocialLinksError) {
        setIsSavingProfile(false);
        setProfileSaveError(insertSocialLinksError.message);
        return;
      }
    }

    setProfile((current) =>
      current
        ? {
            ...current,
            nickname: editDraft.nickname.trim() || current.nickname,
            title: editDraft.title.trim() || null,
            category: editDraft.category.trim() || null,
            avatar_url: editDraft.avatarUrl.trim() || null,
            banner_url: editDraft.bannerUrl.trim() || null,
            popup_animation_style: editDraft.popupAnimationStyle || "none",
            bio: editDraft.bio.trim() || null,
            description: editDraft.description.trim() || null,
            tags: nextTags,
          }
        : current,
    );
    setSocialLinks(nextSocialLinks);
    setIsSavingProfile(false);
    setIsEditing(false);
    setProfileEditModalOpen(false);

    await refreshCreatorProfile();

    if (startInEditMode) {
      router.replace(creatorPublicPath);
    }
  }

  function handleOpenClaimModal() {
    if (!currentUserId) {
      alert(
        translate(
          t,
          "creatorPopupLoginToClaim",
          "Faça login para reivindicar este perfil.",
        ),
      );
      return;
    }

    setClaimPlatform("youtube");
    setClaimUrl("");
    setClaimImageUsageConsent(false);
    setClaimSending(false);
    setClaimSuccess(false);
    setClaimModalOpen(true);
  }

  async function handleClaimProfile() {
    if (!profile || !currentUserId) {
      alert(
        translate(
          t,
          "creatorPopupLoginToClaim",
          "Faça login para reivindicar este perfil.",
        ),
      );
      return;
    }

    if (!claimUrl.trim()) {
      alert(
        translate(
          t,
          "creatorPopupClaimUrlRequired",
          "Informe o link do canal ou perfil usado para verificação.",
        ),
      );
      return;
    }

    if (!claimImageUsageConsent) {
      alert(
        translate(
          t,
          "creatorImageConsentRequired",
          "Para enviar a solicitação, você precisa autorizar o uso da sua imagem para criação das cartas personalizadas.",
        ),
      );
      return;
    }

    const consentAcceptedAt = new Date().toISOString();

    setClaimSending(true);

    const { error } = await supabase.from("creator_claims").insert({
      creator_id: profile.id,
      user_id: currentUserId,
      verification_platform: claimPlatform,
      verification_url: claimUrl.trim(),
      verification_code: claimCode,
      image_usage_consent: true,
      image_usage_consent_at: consentAcceptedAt,
      image_usage_consent_version: "v1.0",
      image_usage_consent_source: "claim_request",
      image_usage_consent_text:
        "Autorizo o Cardpoc a utilizar minha imagem, nome artístico, identidade pública e conteúdos enviados ou vinculados por mim para criar cartas digitais personalizadas dentro da plataforma.",
      status: "pending",
    });

    setClaimSending(false);

    if (error) {
      alert(error.message);
      return;
    }

    setClaimSuccess(true);
  }

  async function handleFollow() {
    if (!profile) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert(
        translate(
          t,
          "creatorPopupLoginToFollow",
          "Faça login para seguir este creator.",
        ),
      );
      return;
    }

    setFollowLoading(true);

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("creator_followers")
          .delete()
          .eq("creator_id", profile.id)
          .eq("user_id", user.id);

        if (error) {
          alert(error.message);
          return;
        }

        setIsFollowing(false);
        setStats((current) => ({
          ...current,
          followers: Math.max(0, current.followers - 1),
        }));
        return;
      }

      const { error } = await supabase.from("creator_followers").insert({
        creator_id: profile.id,
        user_id: user.id,
      });

      if (error) {
        alert(error.message);
        return;
      }

      setIsFollowing(true);
      setStats((current) => ({
        ...current,
        followers: current.followers + 1,
      }));

      const metadata = {
        creator_id: profile.id,
        creator_username: profile.username,
        creator_nickname: nickname,
      };

      const followAlreadyRewarded = await hasXpEvent(
        user.id,
        "follow_creator",
        { creator_id: profile.id },
      );

      if (!followAlreadyRewarded) {
        await addXpAndNotifyLevelUp({
          userId: user.id,
          eventType: "follow_creator",
          metadata,
        });

        await createUserNotification({
          userId: user.id,
          type: "follow_creator",
          title: `${translate(
            t,
            "creatorPopupFollowNotificationPrefix",
            "Você seguiu",
          )} ${nickname}`,
          message: translate(
            t,
            "creatorPopupFollowXpMessage",
            "Você ganhou XP por seguir um creator.",
          ),
          metadata,
        });
      }

      await updateMissionProgress("follow_creator", 1, metadata);

      const { data: existingCard } = await supabase
        .from("user_cards")
        .select("id")
        .eq("creator_id", profile.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existingCard) {
        const { data: newCard, error: cardError } = await supabase
          .from("user_cards")
          .insert({
            creator_id: profile.id,
            user_id: user.id,
            rarity: "common",
            source: "follow",
          })
          .select("id, rarity, source, obtained_at")
          .single();

        if (cardError) {
          console.error("Erro ao criar carta do usuário:", cardError);
        } else {
          await addXpAndNotifyLevelUp({
            userId: user.id,
            eventType: "collect_common_card",
            metadata: {
              creator_id: profile.id,
              creator_username: profile.username,
              creator_nickname: nickname,
              card_id: newCard?.id,
              rarity: newCard?.rarity,
              source: newCard?.source,
            },
          });

          await createUserNotification({
            userId: user.id,
            type: "card_unlocked",
            title: `${translate(
              t,
              "creatorPopupCardUnlockedNotificationTitle",
              "Carta desbloqueada:",
            )} ${nickname}`,
            message: translate(
              t,
              "creatorPopupCardUnlockedByFollow",
              "Você ganhou uma carta comum por seguir este creator.",
            ),
            metadata: {
              creator_id: profile.id,
              creator_username: profile.username,
              creator_nickname: nickname,
              card_id: newCard?.id,
              rarity: newCard?.rarity,
              source: newCard?.source,
            },
          });

          await updateMissionProgress("collect_card", 1, {
            creator_id: profile.id,
            creator_username: profile.username,
            creator_nickname: nickname,
            rarity: newCard?.rarity,
            source: newCard?.source,
          });
        }
      }
    } finally {
      setFollowLoading(false);
    }
  }

  async function copyProfileLink() {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://www.cardpoc.com";
    const fullProfileUrl = `${baseUrl}${profileUrl}`;

    try {
      await navigator.clipboard.writeText(fullProfileUrl);
      setProfileLinkCopied(true);
      window.setTimeout(() => setProfileLinkCopied(false), 1800);
    } catch {
      window.open(profileUrl, "_blank", "noopener,noreferrer");
    }
  }

  const socialDropdownItems = useCreatorSocialDropdownItems({
    socialLinks,
    visibleYoutubeChannels,
  });

  const {
    twitchProfileUrl,
    kickProfileUrl,
    livePlatformItems,
    liveDropsPlatform,
    heroLiveStatus,
  } = useCreatorLivePlatformItems({
    socialLinks,
    twitchStatus,
    kickStatus,
  });

  const creatorForPopup: Creator | null = profile
    ? {
        id: profile.id,
        ownerId: profile.user_id || undefined,
        username: profile.username,
        nickname,
        title,
        faction: "",
        category,
        mainPlatform: "youtube",
        status: normalizeCreatorStatus(profile.status),
        avatarUrl: profile.avatar_url || "",
        bannerUrl: profile.banner_url || "",
        popupAnimationStyle: profile.popup_animation_style || "none",
        bio,
        description,
        tags,
        rank: normalizeCreatorRank(card?.rank),
        rarity: normalizeCreatorRarity(rarity),
        aura: card?.aura || "Origin Aura",
        evolutionStage: card?.evolution_stage || "Stage 1 — Rising Creator",
        powerScore: card?.power_score || 0,
        collectedBy: 0,
        level: (profile as any)?.profile_level || card?.level || 1,
        followers: stats.followers,
        likes: 0,
        views: stats.views,
        socials: normalizeCreatorSocials(socialLinks),
        traits: [],
        featuredMoment: {
          title: "",
          description: "",
        },
        achievements: [],
      }
    : null;

  const showcaseRarity =
    RARITY_SHOWCASE_CYCLE[showcaseRarityIndex]?.rarity || rarity;
  const creatorForCard: Creator | null = creatorForPopup
    ? {
        ...creatorForPopup,
        rarity: normalizeCreatorRarity(showcaseRarity),
      }
    : null;

  const selectedBattleCard = selectedBattleCreator
    ? Array.isArray(selectedBattleCreator.creator_cards)
      ? selectedBattleCreator.creator_cards[0] || null
      : selectedBattleCreator.creator_cards || null
    : null;

  const selectedBattleCreatorForCard: Creator | null = selectedBattleCreator
    ? {
        id: selectedBattleCreator.id,
        username: selectedBattleCreator.username,
        nickname: selectedBattleCreator.nickname,
        title: translate(t, "creatorProfileBattleOpponent", "Oponente"),
        faction: "",
        category: translate(t, "creatorProfileDefaultCategory", "Criador"),
        mainPlatform: "youtube",
        status: "offline" as CreatorStatus,
        avatarUrl: selectedBattleCreator.avatar_url || "",
        bannerUrl: selectedBattleCreator.avatar_url || "",
        popupAnimationStyle: "none",
        bio: "",
        description: "",
        tags: [],
        rank: normalizeCreatorRank(selectedBattleCard?.rank),
        rarity: normalizeCreatorRarity(selectedBattleCard?.rarity || "common"),
        aura: selectedBattleCard?.aura || "Origin Aura",
        evolutionStage: selectedBattleCard?.evolution_stage || "Stage 1 — Rising Creator",
        powerScore: selectedBattleCard?.power_score || 0,
        collectedBy: battleStats?.uniqueCollectors || 0,
        level: selectedBattleCard?.level || battleStats?.level || 1,
        followers: battleStats?.followers || 0,
        likes: 0,
        views: battleStats?.views || 0,
        socials: [],
        traits: [],
        featuredMoment: {
          title: "",
          description: "",
        },
        achievements: [],
      }
    : null;

  const isProfileClaimable = !profile?.user_id;

  if (loading) {
    return null;
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#020617] px-6 py-10 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center text-center">
          <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 p-4 text-cyan-100">
            <Sparkles className="h-7 w-7" />
          </div>

          <h1 className="mt-6 text-3xl font-black tracking-tight md:text-5xl">
            {translate(
              t,
              "creatorProfileNotFoundTitle",
              "Criador não encontrado",
            )}
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/60 md:text-base">
            {translate(
              t,
              "creatorProfileNotFoundDescription",
              "Este perfil ainda não está público ou não existe no Cardpoc.",
            )}
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/20"
          >
            <ArrowLeft className="h-4 w-4" />
            {translate(t, "creatorProfileBackHome", "Voltar para o Cardpoc")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <GlowBackground />
      <ParticleBackground />

      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(34,211,238,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.035)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />
      <div className="pointer-events-none absolute left-1/2 top-28 z-0 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[90px]" />
      <div className="pointer-events-none absolute bottom-24 right-10 z-0 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-8">
        <div className="flex min-h-[40px] flex-wrap items-center justify-end gap-3">
          {canManageProfile && !isEditing ? (
            <div ref={creatorPanelDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setCreatorPanelOpen((current) => !current)}
                className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/25 bg-fuchsia-300/10 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-fuchsia-100 backdrop-blur transition hover:bg-fuchsia-300/20"
                aria-expanded={creatorPanelOpen}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {translate(
                  t,
                  "creatorProfileCreatorPanelButton",
                  "Painel do Criador",
                )}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition ${creatorPanelOpen ? "rotate-180" : ""}`}
                />
              </button>

              {creatorPanelOpen ? (
                <div className="absolute right-0 z-50 mt-2 w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-[1.15rem] border border-white/10 bg-[#100913]/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setCreatorPanelOpen(false);
                      setCreatorStatsOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-[0.85rem] px-2.5 py-2.5 text-left text-xs font-bold text-emerald-100 transition hover:bg-emerald-300/10"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/10">
                      <BarChart3 className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 uppercase tracking-[0.16em]">
                      {translate(
                        t,
                        "creatorProfileStatsButton",
                        "Estatísticas",
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCreatorPanelOpen(false);
                      setLiveDropsOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-[0.85rem] px-2.5 py-2.5 text-left text-xs font-bold text-amber-100 transition hover:bg-amber-300/10"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-300/20 bg-amber-300/10">
                      <Gift className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 uppercase tracking-[0.16em]">
                      {translate(
                        t,
                        "creatorProfileLiveDropsButton",
                        "Drops de Live",
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCreatorPanelOpen(false);
                      setSupportChatOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-[0.85rem] px-2.5 py-2.5 text-left text-xs font-bold text-cyan-100 transition hover:bg-cyan-300/10"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10">
                      <MessageCircle className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 uppercase tracking-[0.16em]">
                      {translate(
                        t,
                        "creatorProfileTalkToTeam",
                        "Falar com a equipe",
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCreatorPanelOpen(false);
                      handleOpenProfileEditModal();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-[0.85rem] px-2.5 py-2.5 text-left text-xs font-bold text-fuchsia-100 transition hover:bg-fuchsia-300/10"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 uppercase tracking-[0.16em]">
                      {translate(
                        t,
                        "creatorProfileManageProfile",
                        "Gerenciar perfil",
                      )}
                    </span>
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <section className="mt-8 grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-stretch xl:grid-cols-[390px_minmax(0,1fr)]">
          <CreatorCardPanel
            t={t}
            creatorForCard={creatorForCard}
            isEditing={isEditing}
            editDraft={editDraft}
            popupEffectDropdownRef={popupEffectDropdownRef}
            popupEffectDropdownOpen={popupEffectDropdownOpen}
            collectionStats={collectionStats}
            highestCollectedRarity={highestCollectedRarity}
            onTogglePopupEffectDropdown={() =>
              setPopupEffectDropdownOpen((current) => !current)
            }
            onClosePopupEffectDropdown={() => setPopupEffectDropdownOpen(false)}
            onEditDraftChange={handleEditDraftChange}
          />

          <div className="min-w-0 self-start rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl lg:min-h-[626px] lg:p-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-cyan-100 backdrop-blur">
                {translate(t, "creatorProfilePublicProfile", "Perfil público")}
              </span>

              {isLive ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-red-300/30 bg-red-500/15 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-red-100 shadow-lg shadow-red-500/10">
                  <Radio className="h-3.5 w-3.5 animate-pulse" />
                  {translate(t, "creatorProfileLiveNow", "Ao vivo agora")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-white/45 backdrop-blur">
                  <WifiOff className="h-3.5 w-3.5" />
                  {translate(t, "creatorProfileOffline", "Offline")}
                </span>
              )}

              {profile.is_verified ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-yellow-100 backdrop-blur">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {translate(t, "creatorProfileVerified", "Verificado")}
                </span>
              ) : null}
            </div>

            {isEditing && editDraft ? (
              <div className="mt-6 rounded-[1.8rem] border border-cyan-300/15 bg-black/30 p-4 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl md:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100/65">
                      {translate(t, "creatorProfileInlineEditTitle", "Editando perfil público")}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-white/42">
                      {translate(t, "creatorProfileInlineEditDescription", "Edite no mesmo contexto em que o público vê a página.")}
                    </p>
                  </div>
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">
                    {translate(t, "creatorProfileEditModeBadge", "Modo edição")}
                  </span>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                <label className="block xl:col-span-2">
                  <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/70">
                    {translate(
                      t,
                      "creatorProfileEditNickname",
                      "Nome de exibição",
                    )}
                  </span>
                  <input
                    value={editDraft.nickname}
                    onChange={(event) =>
                      handleEditDraftChange("nickname", event.target.value)
                    }
                    className="mt-2 w-full rounded-[1.2rem] border border-cyan-300/20 bg-black/35 px-4 py-3 text-3xl font-black tracking-[-0.04em] text-white outline-none transition focus:border-cyan-300/55 md:text-5xl"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/70">
                      {translate(t, "creatorProfileEditTitle", "Título")}
                    </span>
                    <input
                      value={editDraft.title}
                      onChange={(event) =>
                        handleEditDraftChange("title", event.target.value)
                      }
                      className="mt-2 w-full rounded-[1.2rem] border border-white/10 bg-black/35 px-4 py-3 text-base font-semibold text-cyan-100 outline-none transition focus:border-cyan-300/45"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/70">
                      {translate(t, "creatorProfileEditCategory", "Categoria")}
                    </span>
                    <input
                      value={editDraft.category}
                      onChange={(event) =>
                        handleEditDraftChange("category", event.target.value)
                      }
                      className="mt-2 w-full rounded-[1.2rem] border border-white/10 bg-black/35 px-4 py-3 text-base font-semibold text-white/85 outline-none transition focus:border-cyan-300/45"
                    />
                  </label>
                </div>

                <label className="block xl:col-span-2">
                  <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/70">
                    {translate(t, "creatorProfileEditBio", "Bio curta")}
                  </span>
                  <textarea
                    value={editDraft.bio}
                    onChange={(event) =>
                      handleEditDraftChange("bio", event.target.value)
                    }
                    rows={3}
                    className="mt-2 w-full resize-none rounded-[1.2rem] border border-white/10 bg-black/35 px-4 py-3 text-base leading-7 text-white/80 outline-none transition focus:border-cyan-300/45"
                  />
                </label>
                </div>
              </div>
            ) : (
              <>
                <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-[-0.06em] text-white drop-shadow-[0_0_32px_rgba(34,211,238,0.16)] md:text-7xl">
                  {nickname}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <p className="text-lg font-semibold text-cyan-100/90 md:text-2xl">
                    {title}
                  </p>
                  <span className="text-sm font-bold text-white/38">
                    @{profile.username}
                  </span>
                </div>

                <p className="mt-6 max-w-3xl text-base leading-8 text-white/68 md:text-lg">
                  {bio}
                </p>
              </>
            )}

            <CreatorProfileHeroActions
              t={t}
              isEditing={isEditing}
              editDraft={editDraft}
              visibleTags={visibleTags}
              followLoading={followLoading}
              isFollowing={isFollowing}
              profileLinkCopied={profileLinkCopied}
              isProfileClaimable={isProfileClaimable}
              socialLinksDropdownRef={socialLinksDropdownRef}
              socialLinksOpen={socialLinksOpen}
              socialDropdownItems={socialDropdownItems}
              liveStatus={liveStatus}
              visibleYoutubeChannels={visibleYoutubeChannels}
              youtubeExternalReach={youtubeExternalReach}
              onFollow={handleFollow}
              onCopyProfileLink={copyProfileLink}
              onOpenClaimModal={handleOpenClaimModal}
              onToggleSocialLinks={() => setSocialLinksOpen((current) => !current)}
              onCloseSocialLinks={() => setSocialLinksOpen(false)}
              onOpenYoutubeChannels={() => setYoutubeChannelsOpen(true)}
              onEditDraftChange={handleEditDraftChange}
            />

            <CreatorProfileStatsGrid
              t={t}
              stats={stats}
              externalReach={externalReach}
              liveStatusLoading={liveStatusLoading}
            />

            <CreatorBattleCta
              t={t}
              disabled={battleCandidates.length === 0}
              onOpen={openBattleModal}
            />

          </div>
        </section>

        <CreatorBattleModal
          open={battleModalOpen}
          t={t}
          nickname={nickname}
          creatorForCard={creatorForCard}
          battleStarted={battleStarted}
          battleSearchQuery={battleSearchQuery}
          filteredBattleCandidates={filteredBattleCandidates}
          selectedBattleCreatorId={selectedBattleCreatorId}
          selectedBattleCreator={selectedBattleCreator}
          selectedBattleCreatorForCard={selectedBattleCreatorForCard}
          battleStatsReady={Boolean(battleStats)}
          battleLoading={battleLoading}
          visibleBattleRows={visibleBattleRows}
          battleRowsLength={battleRows.length}
          revealedBattleRows={revealedBattleRows}
          visibleBattleScore={visibleBattleScore}
          battleAnimationComplete={battleAnimationComplete}
          battleFinalWinner={battleFinalWinner}
          onClose={closeBattleModal}
          onBattleSearchQueryChange={setBattleSearchQuery}
          onSelectBattleCandidate={(creatorId) => {
            setSelectedBattleCreatorId(creatorId);
            setBattleStarted(false);
            setRevealedBattleRows(0);
          }}
          onStartBattleAnimation={startBattleAnimation}
        />

        <CreatorLiveBanner
          t={t}
          heroLiveStatus={heroLiveStatus}
          livePlatformItems={livePlatformItems}
          onOpenLivePlatforms={() => setLivePlatformsOpen(true)}
        />

        <section className="mt-8">
          <div className="space-y-6">
            <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-cyan-200" />
                <h2 className="text-2xl font-black tracking-tight">
                  {translate(t, "creatorProfileAboutTitle", "Sobre o criador")}
                </h2>
              </div>

              {isEditing && editDraft ? (
                <textarea
                  value={editDraft.description}
                  onChange={(event) =>
                    handleEditDraftChange("description", event.target.value)
                  }
                  rows={7}
                  className="mt-5 w-full resize-none rounded-[1.2rem] border border-white/10 bg-black/35 px-4 py-3 text-base leading-8 text-white/75 outline-none transition focus:border-cyan-300/45"
                />
              ) : (
                <p className="mt-5 whitespace-pre-line text-base leading-8 text-white/68">
                  {description}
                </p>
              )}
            </article>

            <CreatorPartnershipsSection
              t={t}
              isEditing={isEditing}
              editDraft={editDraft}
              visiblePartnerships={visiblePartnerships}
              partnershipHistoryCount={partnershipHistoryCount}
              manualPartnershipDraft={manualPartnershipDraft}
              manualPartnershipSaving={manualPartnershipSaving}
              manualPartnershipError={manualPartnershipError}
              onManualPartnershipDraftChange={handleManualPartnershipDraftChange}
              onAddManualPartnership={handleAddManualPartnership}
            />

            {isEditing && editDraft ? (
              <article className="rounded-[2rem] border border-cyan-300/15 bg-cyan-300/[0.035] p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl md:p-8">
                <div className="flex items-center gap-3">
                  <Globe2 className="h-5 w-5 text-cyan-200" />
                  <h2 className="text-2xl font-black tracking-tight">
                    {translate(
                      t,
                      "creatorProfileEditMediaTitle",
                      "Mídia e links",
                    )}
                  </h2>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/70">
                      {translate(
                        t,
                        "creatorProfileEditAvatarUrl",
                        "URL do avatar",
                      )}
                    </span>
                    <input
                      value={editDraft.avatarUrl}
                      onChange={(event) =>
                        handleEditDraftChange("avatarUrl", event.target.value)
                      }
                      className="mt-2 w-full rounded-[1.2rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80 outline-none transition focus:border-cyan-300/45"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/70">
                      {translate(
                        t,
                        "creatorProfileEditBannerUrl",
                        "URL do banner",
                      )}
                    </span>
                    <input
                      value={editDraft.bannerUrl}
                      onChange={(event) =>
                        handleEditDraftChange("bannerUrl", event.target.value)
                      }
                      className="mt-2 w-full rounded-[1.2rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80 outline-none transition focus:border-cyan-300/45"
                    />
                  </label>
                </div>

                <div className="mt-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/70">
                      {translate(
                        t,
                        "creatorProfileEditSocialLinks",
                        "Links sociais",
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={handleAddEditSocialLink}
                      className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100 transition hover:bg-cyan-300/15"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {translate(
                        t,
                        "creatorProfileEditAddSocialLink",
                        "Adicionar link",
                      )}
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3">
                    {getEditSocialLinkRows(editDraft.socialLinksText).map(
                      (social, index) => (
                        <div
                          key={`social-link-${index}`}
                          className="grid gap-3 rounded-[1.2rem] border border-white/10 bg-black/25 p-3 md:grid-cols-[180px_minmax(0,1fr)_auto]"
                        >
                          <select
                            value={social.platform || "link"}
                            onChange={(event) =>
                              handleEditSocialLinkChange(
                                index,
                                "platform",
                                event.target.value,
                              )
                            }
                            className="rounded-[1rem] border border-white/10 bg-black/35 px-3 py-3 text-sm font-bold text-cyan-100 outline-none transition focus:border-cyan-300/45"
                          >
                            {SOCIAL_PLATFORM_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>

                          <input
                            value={social.url}
                            onChange={(event) =>
                              handleEditSocialLinkChange(
                                index,
                                "url",
                                event.target.value,
                              )
                            }
                            placeholder="https://..."
                            className="rounded-[1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80 outline-none transition placeholder:text-white/25 focus:border-cyan-300/45"
                          />

                          <button
                            type="button"
                            onClick={() => handleRemoveEditSocialLink(index)}
                            className="inline-flex items-center justify-center rounded-[1rem] border border-red-300/15 bg-red-500/10 px-4 py-3 text-red-100 transition hover:bg-red-500/15"
                            aria-label={translate(
                              t,
                              "creatorProfileEditRemoveSocialLink",
                              "Remover link",
                            )}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </article>
            ) : null}

            <CreatorClipsSection
              t={t}
              clipsLoading={clipsLoading}
              clips={clips}
              clipPlatformSections={clipPlatformSections}
              selectedClipPlatform={selectedClipPlatform}
              selectedPlatformClips={selectedPlatformClips}
              socialLinks={socialLinks}
              onSelectClipPlatform={setActiveClipPlatform}
            />
          </div>
        </section>
      </div>

      {profile ? (
        <LiveDropsModal
          open={liveDropsOpen}
          onClose={() => setLiveDropsOpen(false)}
          creatorId={profile.id}
          creatorName={profile.nickname || profile.username}
          platform={liveDropsPlatform.key}
          isLive={Boolean(liveDropsPlatform.status?.isLive)}
          viewerCount={liveDropsPlatform.status?.viewerCount || 0}
          liveTitle={liveDropsPlatform.status?.title || null}
        />
      ) : null}

      {creatorStatsOpen && profile ? (
        <CreatorStatsModal
          open={creatorStatsOpen}
          onClose={() => setCreatorStatsOpen(false)}
          creatorName={profile.nickname || profile.username}
          stats={stats}
          collectionStats={collectionStats}
          liveStatus={liveStatus}
          externalReach={externalReach}
          cardLevel={cardLevel}
          profileXp={Number((profile as any)?.profile_xp || 0)}
          dropsCount={0}
        />
      ) : null}

      <CreatorLivePlatformsModal
        t={t}
        open={livePlatformsOpen}
        livePlatformItems={livePlatformItems}
        onClose={() => setLivePlatformsOpen(false)}
      />

      {youtubeChannelsOpen ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 p-4">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setYoutubeChannelsOpen(false)}
            aria-label={translate(
              t,
              "creatorPopupCloseYoutubeChannels",
              "Fechar canais do YouTube",
            )}
          />

          <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-white/15 bg-zinc-950 p-5 text-white shadow-[0_0_70px_rgba(0,0,0,0.9)] sm:p-6">
            <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-red-500/20 blur-[70px]" />
            <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-cyan-500/20 blur-[70px]" />

            <div className="relative z-10">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">
                YouTube
              </p>

              <h3 className="mt-3 text-xl font-black sm:text-2xl">
                {translate(
                  t,
                  "creatorPopupYoutubeChannelsTitle",
                  "Canais do YouTube",
                )}
              </h3>

              <p className="mt-2 text-sm text-white/45">
                {translate(
                  t,
                  "creatorPopupYoutubeChannelsDescription",
                  "Escolha qual canal você quer abrir.",
                )}
              </p>

              <div className="mt-5 grid gap-3">
                {youtubeChannelItems.map((channel, index) => (
                  <a
                    key={`${channel.url}-${index}`}
                    href={channel.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                  >
                    {channel.thumbnail ? (
                      <img
                        src={channel.thumbnail}
                        alt={channel.title}
                        loading="lazy"
                        decoding="async"
                        className="h-12 w-12 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-xs font-bold text-cyan-100">
                        YT
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-white">
                        {channel.title}
                      </p>

                      <p className="text-sm text-white/45">
                        {formatNumber(channel.subscriberCount)}{" "}
                        {translate(
                          t,
                          "creatorPopupYoutubeSubscribers",
                          "inscritos",
                        )}
                      </p>
                    </div>
                  </a>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setYoutubeChannelsOpen(false)}
                className="mt-5 w-full rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white/70 transition hover:bg-white/[0.08]"
              >
                {translate(t, "creatorProfileClose", "Fechar")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <CreatorClaimModal
        open={claimModalOpen}
        t={t}
        claimSuccess={claimSuccess}
        claimCode={claimCode}
        claimPlatform={claimPlatform}
        claimUrl={claimUrl}
        claimImageUsageConsent={claimImageUsageConsent}
        claimSending={claimSending}
        onClose={() => setClaimModalOpen(false)}
        onClaimPlatformChange={setClaimPlatform}
        onClaimUrlChange={setClaimUrl}
        onClaimImageUsageConsentChange={setClaimImageUsageConsent}
        onSubmit={handleClaimProfile}
      />

      <CreatorEditProfileModal
        open={Boolean(profile && canManageProfile && profileEditModalOpen)}
        editDraft={editDraft}
        isSavingProfile={isSavingProfile}
        profileSaveError={profileSaveError}
        popupEffectDropdownOpen={popupEffectDropdownOpen}
        popupEffectDropdownRef={popupEffectDropdownRef}
        t={t}
        onClose={handleCloseProfileEditModal}
        onSave={handleSaveProfileEdit}
        onDraftChange={handleEditDraftChange}
        onSocialLinkChange={handleEditSocialLinkChange}
        onAddSocialLink={handleAddEditSocialLink}
        onRemoveSocialLink={handleRemoveEditSocialLink}
        onToggleEffectDropdown={() =>
          setPopupEffectDropdownOpen((current) => !current)
        }
        onCloseEffectDropdown={() => setPopupEffectDropdownOpen(false)}
      />

      {profile && canManageProfile ? (
        <SupportChatModal
          open={supportChatOpen}
          onClose={() => setSupportChatOpen(false)}
          currentUserId={currentUserId}
          creatorId={profile.id}
          creatorName={profile.nickname || profile.username}
        />
      ) : null}

      <CreatorEditFloatingSaveBar
        visible={Boolean(isEditing && canManageProfile)}
        isSavingProfile={isSavingProfile}
        profileSaveError={profileSaveError}
        t={t}
        onCancel={handleCancelEditMode}
        onSave={handleSaveProfileEdit}
      />
    </main>
  );
}
