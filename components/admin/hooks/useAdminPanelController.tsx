"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  EyeOff,
  Gift,
  Handshake,
  History,
  ImageIcon,
  Link,
  MessageCircle,
  Send,
  Ban,
  BarChart3,
  RotateCcw,
  Package,
  Search,
  Upload,
  ShieldCheck,
  UserCog,
  X,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase/client";
import { CardpocModalShell } from "@/components/ui/CardpocModalShell";

export type TranslationKey = Parameters<ReturnType<typeof useLanguage>["t"]>[0];

export function translateExisting(t: unknown, key: string, fallback: string) {
  const value = (t as Record<string, string | undefined>)[key];
  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback;
}

export type AdminPanelModalProps = {
  open: boolean;
  onClose: () => void;
};

export type Tab =
  | "requests"
  | "users"
  | "creators"
  | "creatorDetector"
  | "cards"
  | "claims"
  | "partnerships"
  | "conversations"
  | "logs"
  | "statistics";

export type GrantRarity = "common" | "rare" | "epic" | "legendary" | "random";

export type AdminPackType =
  | "common_pack"
  | "rare_pack"
  | "epic_pack"
  | "legendary_pack"
  | "random_pack";

export type AdminRewardType = "card" | "pack";
export type AdminRewardTarget = "user" | "all_users";

export const ADMIN_TABS: { id: Tab; labelKey: string; fallback: string }[] = [
  { id: "requests", labelKey: "adminRequests", fallback: "Solicitações" },
  { id: "users", labelKey: "adminUsers", fallback: "Usuários" },
  { id: "creators", labelKey: "adminProfiles", fallback: "Perfis" },
  {
    id: "creatorDetector",
    labelKey: "adminCreatorDetector",
    fallback: "Detectar Criadores",
  },
  { id: "cards", labelKey: "adminManageCards", fallback: "Gerenciar Cartas" },
  { id: "claims", labelKey: "adminClaims", fallback: "Reivindicações" },
  {
    id: "partnerships",
    labelKey: "adminPartnerships",
    fallback: "Parcerias Detectadas",
  },
  {
    id: "conversations",
    labelKey: "adminConversations",
    fallback: "Conversas",
  },
  { id: "logs", labelKey: "adminActivities", fallback: "Atividades" },
  { id: "statistics", labelKey: "adminStatistics", fallback: "Estatísticas" },
];

export const GRANT_RARITIES: {
  id: GrantRarity;
  labelKey: TranslationKey;
  fallback: string;
  descriptionKey: TranslationKey;
  descriptionFallback: string;
}[] = [
  {
    id: "common",
    labelKey: "common",
    fallback: "Comum",
    descriptionKey: "adminRarityCommonDescription",
    descriptionFallback: "Prata metálico",
  },
  {
    id: "rare",
    labelKey: "rare",
    fallback: "Raro",
    descriptionKey: "adminRarityRareDescription",
    descriptionFallback: "Azul claro elétrico",
  },
  {
    id: "epic",
    labelKey: "epic",
    fallback: "Épico",
    descriptionKey: "adminRarityEpicDescription",
    descriptionFallback: "Violeta arcano",
  },
  {
    id: "legendary",
    labelKey: "legendary",
    fallback: "Lendário",
    descriptionKey: "adminRarityLegendaryDescription",
    descriptionFallback: "Ouro celestial",
  },
  {
    id: "random",
    labelKey: "adminRandom",
    fallback: "Aleatório",
    descriptionKey: "adminRarityRandomDescription",
    descriptionFallback: "Sorteia entre as 4 raridades",
  },
];

export const ADMIN_PACK_TYPES: {
  id: AdminPackType;
  labelKey: TranslationKey;
  fallback: string;
  descriptionKey: TranslationKey;
  descriptionFallback: string;
}[] = [
  {
    id: "random_pack",
    labelKey: "adminRandomPack",
    fallback: "Pacote Aleatório",
    descriptionKey: "adminRandomPackDescription",
    descriptionFallback: "Sorteia cartas entre todas as raridades.",
  },
  {
    id: "common_pack",
    labelKey: "adminCommonPack",
    fallback: "Pacote Comum",
    descriptionKey: "adminCommonPackDescription",
    descriptionFallback: "Pacote base com maior chance de cartas comuns.",
  },
  {
    id: "rare_pack",
    labelKey: "adminRarePack",
    fallback: "Pacote Raro",
    descriptionKey: "adminRarePackDescription",
    descriptionFallback: "Pacote com maior chance de cartas raras.",
  },
  {
    id: "epic_pack",
    labelKey: "adminEpicPack",
    fallback: "Pacote Épico",
    descriptionKey: "adminEpicPackDescription",
    descriptionFallback: "Pacote com maior chance de cartas épicas.",
  },
  {
    id: "legendary_pack",
    labelKey: "adminLegendaryPack",
    fallback: "Pacote Lendário",
    descriptionKey: "adminLegendaryPackDescription",
    descriptionFallback: "Pacote premium com chance elevada de carta lendária.",
  },
];

export const PARTNERSHIP_TYPE_OPTIONS = [
  {
    id: "sponsorship",
    labelKey: "adminPartnershipTypeSponsorship",
    fallback: "Patrocínio",
  },
  {
    id: "ambassador",
    labelKey: "adminPartnershipTypeAmbassador",
    fallback: "Embaixador",
  },
  {
    id: "campaign",
    labelKey: "adminPartnershipTypeCampaign",
    fallback: "Campanha",
  },
  { id: "event", labelKey: "adminPartnershipTypeEvent", fallback: "Evento" },
  {
    id: "partnership",
    labelKey: "adminPartnershipTypePartnership",
    fallback: "Parceria",
  },
];

const RARITY_LEVEL: Record<Exclude<GrantRarity, "random">, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 5,
};

export function rollRandomRarity(): Exclude<GrantRarity, "random"> {
  const roll = Math.random() * 100;

  if (roll < 60) return "common";
  if (roll < 88) return "rare";
  if (roll < 98) return "epic";
  return "legendary";
}

export type TranslateFunction = (key: any) => string;

export function translate(t: TranslateFunction, key: string, fallback: string) {
  const value = t(key);

  return value && value !== key ? value : fallback;
}

export function getDateLocale(language: string) {
  if (language === "en") return "en-US";
  if (language === "es") return "es-ES";

  return "pt-BR";
}

export function getSupportStatusLabel(
  t: TranslateFunction,
  status: SupportConversationStatus,
) {
  const labels: Record<SupportConversationStatus, [string, string]> = {
    open: ["supportStatusOpen", "Aberto"],
    waiting_admin: ["supportStatusWaitingAdmin", "Aguardando equipe"],
    waiting_user: ["supportStatusWaitingUser", "Aguardando criador"],
    resolved: ["supportStatusResolved", "Resolvido"],
    closed: ["supportStatusClosed", "Encerrado"],
  };
  const [key, fallback] = labels[status] || labels.open;
  return translateExisting(t, key, fallback);
}

export function getSupportTypeLabel(
  t: TranslateFunction,
  type: SupportConversationType,
) {
  const labels: Record<SupportConversationType, [string, string]> = {
    bug: ["supportTypeBug", "Bug"],
    profile_correction: ["supportTypeProfileCorrection", "Correção de perfil"],
    claim_profile: ["supportTypeClaimProfile", "Reivindicação"],
    card_pack_problem: ["supportTypeCardPackProblem", "Carta/Pacote"],
    suggestion: ["supportTypeSuggestion", "Sugestão"],
    other: ["supportTypeOther", "Outro"],
  };
  const [key, fallback] = labels[type] || labels.other;
  return translateExisting(t, key, fallback);
}

export function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getPartnershipTypeLabel(type: string, t: TranslateFunction) {
  const option = PARTNERSHIP_TYPE_OPTIONS.find((item: any) => item.id === type);

  if (!option) return type;

  return translate(t, option.labelKey as TranslationKey, option.fallback);
}

export function getGrantRarityLabel(
  rarity: GrantRarity | string,
  t: TranslateFunction,
) {
  const rarityOption = GRANT_RARITIES.find((item: any) => item.id === rarity);

  if (!rarityOption) return rarity;

  return translate(
    t,
    rarityOption.labelKey as TranslationKey,
    rarityOption.fallback,
  );
}

export function getAdminPackLabel(
  packType: AdminPackType | string,
  t: TranslateFunction,
) {
  const packOption = ADMIN_PACK_TYPES.find((item: any) => item.id === packType);

  if (!packOption) return packType;

  return translate(
    t,
    packOption.labelKey as TranslationKey,
    packOption.fallback,
  );
}

export type CreatorRequest = {
  id: string;
  user_id: string;
  nickname: string;
  username: string;
  email: string;
  category: string;
  verification_platform: string | null;
  verification_url: string | null;
  verification_code: string;
  card_image_url: string | null;
  image_source: string | null;
  status: "pending" | "approved" | "rejected" | "verified";
  created_at: string;
};

export type ProfileUser = {
  id: string;
  email: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_admin: boolean | null;
  is_banned?: boolean | null;
  created_at: string;
};

export type CreatorProfile = {
  id: string;
  user_id: string | null;
  nickname: string;
  username: string;
  title: string | null;
  category: string | null;
  avatar_url: string | null;
  is_public: boolean | null;
  is_verified: boolean | null;
  owner_status: string | null;
  created_at: string;
  share_count: number | null;
  trending_score: number | null;
  views_count?: number;
  followers_count?: number;
};

export type CreatorProfileVisibilityFilter = "all" | "public" | "hidden";
export type CreatorProfileVerificationFilter = "all" | "verified" | "not_verified";
export type CreatorProfileOwnerFilter = "all" | "claimed" | "unclaimed";
export type CreatorProfileSortFilter =
  | "newest"
  | "oldest"
  | "name"
  | "views"
  | "followers"
  | "shares"
  | "trending";

export type CreatorDetectorPlatform = "kick" | "twitch";

export type DetectedKickCreator = {
  id?: string | number | null;
  platform?: CreatorDetectorPlatform;
  slug: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  category?: string | null;
  stream_title?: string | null;
  viewer_count?: number | null;
  followers_count?: number | null;
  language?: string | null;
  url?: string | null;
  thumbnail_url?: string | null;
  already_exists?: boolean;
};

export type CreatorClaim = {
  id: string;
  creator_id: string;
  user_id: string;
  verification_platform: string;
  verification_url: string;
  verification_code: string;
  status: "pending" | "approved" | "rejected" | "verified";
  created_at: string;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
  created_at?: string;
  updated_at?: string | null;
};

export type CreatorPartnership = {
  id: string;
  creator_id: string;
  brand_id: string | null;
  brand_name: string;
  partnership_type: string;
  campaign_name: string | null;
  public_description: string | null;
  website_url: string | null;
  source_platform: string;
  source_url: string | null;
  source_title: string | null;
  source_thumbnail: string | null;
  source_channel: string | null;
  source_published_at: string | null;
  evidence_text: string | null;
  evidence_payload: Record<string, unknown> | null;
  detection_reason: string | null;
  confidence_score: number | null;
  status: "suggested" | "verified" | "rejected" | "manual";
  is_active: boolean | null;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  verified_by: string | null;
  rejected_by: string | null;
  verified_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string | null;
  brands?: Brand | null;
};

export type PartnershipApprovalDraft = {
  partnership: CreatorPartnership;
  brandName: string;
  brandLogoUrl: string;
  brandWebsiteUrl: string;
  brandDescription: string;
  partnershipType: string;
  campaignName: string;
  publicDescription: string;
  websiteUrl: string;
  startDate: string;
  endDate: string;
};

export type AdminStats = {
  visits: number;
  logins: number;
  conqueredCards: number;
  openedPacks: number;
  creatorFollows: number;
  pendingRequests: number;
  pendingClaims: number;
  totalCreators: number;
};

export type AdminLog = {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

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
export type SupportFilter = "active" | "all" | SupportConversationStatus;

export type SupportConversation = {
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

export type SupportMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: "user" | "admin" | "system";
  message: string;
  created_at: string;
  read_at: string | null;
};

export const SUPPORT_STATUS_FILTERS: {
  id: SupportFilter;
  labelKey: string;
  fallback: string;
}[] = [
  {
    id: "active",
    labelKey: "adminConversationFilterActive",
    fallback: "Ativas",
  },
  { id: "all", labelKey: "adminConversationFilterAll", fallback: "Todas" },
  { id: "open", labelKey: "supportStatusOpen", fallback: "Abertas" },
  {
    id: "waiting_admin",
    labelKey: "supportStatusWaitingAdmin",
    fallback: "Aguardando equipe",
  },
  {
    id: "waiting_user",
    labelKey: "supportStatusWaitingUser",
    fallback: "Aguardando criador",
  },
  { id: "resolved", labelKey: "supportStatusResolved", fallback: "Resolvidas" },
  { id: "closed", labelKey: "supportStatusClosed", fallback: "Encerradas" },
];

export const ACTIVE_SUPPORT_STATUSES: SupportConversationStatus[] = [
  "open",
  "waiting_admin",
  "waiting_user",
];
export const FINAL_SUPPORT_STATUSES: SupportConversationStatus[] = [
  "resolved",
  "closed",
];
const CREATOR_IMAGE_BUCKET = "creator-profiles";

export function isSupportConversationFinal(status: SupportConversationStatus) {
  return FINAL_SUPPORT_STATUSES.includes(status);
}


export function useAdminPanelController({ open, onClose }: AdminPanelModalProps) {
  const { language, t } = useLanguage();
  const dateLocale = getDateLocale(language);
  const [activeTab, setActiveTab] = useState<Tab>("requests");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [requests, setRequests] = useState<CreatorRequest[]>([]);
  const [users, setUsers] = useState<ProfileUser[]>([]);
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [claims, setClaims] = useState<CreatorClaim[]>([]);
  const [partnerships, setPartnerships] = useState<CreatorPartnership[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [supportConversations, setSupportConversations] = useState<
    SupportConversation[]
  >([]);
  const [userCardsCount, setUserCardsCount] = useState(0);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    visits: 0,
    logins: 0,
    conqueredCards: 0,
    openedPacks: 0,
    creatorFollows: 0,
    pendingRequests: 0,
    pendingClaims: 0,
    totalCreators: 0,
  });

  const [userSearch, setUserSearch] = useState("");
  const [requestSearch, setRequestSearch] = useState("");
  const [creatorSearch, setCreatorSearch] = useState("");
  const [creatorVisibilityFilter, setCreatorVisibilityFilter] =
    useState<CreatorProfileVisibilityFilter>("all");
  const [creatorVerificationFilter, setCreatorVerificationFilter] =
    useState<CreatorProfileVerificationFilter>("all");
  const [creatorOwnerFilter, setCreatorOwnerFilter] =
    useState<CreatorProfileOwnerFilter>("all");
  const [creatorSortFilter, setCreatorSortFilter] =
    useState<CreatorProfileSortFilter>("newest");
  const [creatorDetectorPlatform, setCreatorDetectorPlatform] =
    useState<CreatorDetectorPlatform>("kick");
  const [hideRegisteredDetectorCreators, setHideRegisteredDetectorCreators] =
    useState(true);
  const [kickDetectorCategory, setKickDetectorCategory] =
    useState("");
  const [kickDetectorLanguage, setKickDetectorLanguage] = useState("pt");
  const [kickDetectorMinViewers, setKickDetectorMinViewers] = useState(0);
  const [kickDetectorLimit, setKickDetectorLimit] = useState(50);
  const [kickDetectorSearch, setKickDetectorSearch] = useState("");
  const [detectedKickCreators, setDetectedKickCreators] = useState<
    DetectedKickCreator[]
  >([]);
  const [selectedDetectedKickCreators, setSelectedDetectedKickCreators] =
    useState<Record<string, boolean>>({});
  const [linkingDetectedCreatorKey, setLinkingDetectedCreatorKey] =
    useState<string | null>(null);
  const [claimSearch, setClaimSearch] = useState("");
  const [partnershipSearch, setPartnershipSearch] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [conversationSearch, setConversationSearch] = useState("");
  const [conversationStatusFilter, setConversationStatusFilter] =
    useState<SupportFilter>("active");
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [conversationReply, setConversationReply] = useState("");
  const [cardCreatorSearch, setCardCreatorSearch] = useState("");
  const [cardUserSearch, setCardUserSearch] = useState("");
  const [selectedCardCreatorId, setSelectedCardCreatorId] = useState("");
  const [selectedCardUserId, setSelectedCardUserId] = useState("");
  const [selectedGrantRarity, setSelectedGrantRarity] =
    useState<GrantRarity>("common");
  const [selectedAdminPackType, setSelectedAdminPackType] =
    useState<AdminPackType>("random_pack");
  const [adminRewardType, setAdminRewardType] =
    useState<AdminRewardType>("card");
  const [adminRewardTarget, setAdminRewardTarget] =
    useState<AdminRewardTarget>("user");
  const [adminCardQuantity, setAdminCardQuantity] = useState(1);
  const [adminPackQuantity, setAdminPackQuantity] = useState(1);

  const [selectedOwners, setSelectedOwners] = useState<Record<string, string>>(
    {},
  );
  const [expandedRequests, setExpandedRequests] = useState<
    Record<string, boolean>
  >({});
  const [expandedCreators, setExpandedCreators] = useState<
    Record<string, boolean>
  >({});
  const [expandedClaims, setExpandedClaims] = useState<Record<string, boolean>>(
    {},
  );
  const [expandedPartnerships, setExpandedPartnerships] = useState<
    Record<string, boolean>
  >({});
  const [partnershipApprovalDraft, setPartnershipApprovalDraft] =
    useState<PartnershipApprovalDraft | null>(null);
  const [brandEnrichmentLoading, setBrandEnrichmentLoading] = useState(false);
  const [brandEnrichmentConfidence, setBrandEnrichmentConfidence] = useState<
    number | null
  >(null);
  const [brandEnrichmentSource, setBrandEnrichmentSource] = useState<
    string | null
  >(null);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [imageEditorCreator, setImageEditorCreator] =
    useState<CreatorProfile | null>(null);
  const [imageEditorUrl, setImageEditorUrl] = useState("");
  const [imageEditorFile, setImageEditorFile] = useState<File | null>(null);
  const [imageEditorObjectUrl, setImageEditorObjectUrl] = useState<string | null>(
    null,
  );

  async function getCurrentUserId() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.id || null;
  }

  async function createAdminLog({
    action,
    targetType,
    targetId,
    metadata = {},
  }: {
    action: string;
    targetType: string;
    targetId: string | null;
    metadata?: Record<string, unknown>;
  }) {
    const adminId = await getCurrentUserId();

    if (!adminId) return;

    await supabase.from("admin_logs").insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      metadata,
    });
  }

  async function loadRequests() {
    const { data } = await supabase
      .from("creator_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    setRequests((data || []) as CreatorRequest[]);
  }

  async function loadUsers() {
    const { data } = await supabase
      .from("profiles")
      .select(
        "id, email, display_name, username, avatar_url, is_admin, is_banned, created_at",
      )
      .order("created_at", { ascending: false });

    setUsers((data || []) as ProfileUser[]);
  }

  async function loadCreators() {
    const { data } = await supabase
      .from("creator_profiles")
      .select(
        "id, user_id, nickname, username, title, category, avatar_url, is_public, is_verified, owner_status, created_at, share_count, trending_score",
      )
      .order("created_at", { ascending: false });

    const creatorsWithStats = await Promise.all(
      ((data || []) as CreatorProfile[]).map(async (creator) => {
        const [{ count: views }, { count: followers }] = await Promise.all([
          supabase
            .from("creator_views")
            .select("id", { count: "exact", head: true })
            .eq("creator_id", creator.id),
          supabase
            .from("creator_followers")
            .select("id", { count: "exact", head: true })
            .eq("creator_id", creator.id),
        ]);

        return {
          ...creator,
          views_count: views || 0,
          followers_count: followers || 0,
          share_count: creator.share_count || 0,
          trending_score: creator.trending_score || 0,
        };
      }),
    );

    setCreators(creatorsWithStats);
  }

  async function loadClaims() {
    const { data } = await supabase
      .from("creator_claims")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    setClaims((data || []) as CreatorClaim[]);
  }

  async function loadPartnerships() {
    const { data } = await supabase
      .from("creator_partnerships")
      .select("*, brands(*)")
      .eq("status", "suggested")
      .order("created_at", { ascending: false });

    setPartnerships((data || []) as CreatorPartnership[]);
  }

  async function loadSupportConversations() {
    const { data } = await supabase
      .from("support_conversations")
      .select("*")
      .order("last_message_at", { ascending: false });

    const rows = (data || []) as SupportConversation[];
    setSupportConversations(rows);
    setSelectedConversationId((current) => current || rows[0]?.id || null);

    const { count: userCardsTotal } = await supabase
      .from("user_cards")
      .select("id", { count: "exact", head: true });

    setUserCardsCount(userCardsTotal ?? 0);
  }

  async function loadSupportMessages(conversationId: string | null) {
    if (!conversationId) {
      setSupportMessages([]);
      return;
    }

    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setSupportMessages((data || []) as SupportMessage[]);
  }

  async function updateSupportConversationStatus(
    conversationId: string,
    status: SupportConversationStatus,
  ) {
    setActionLoading(conversationId);

    await supabase
      .from("support_conversations")
      .update({
        status,
        closed_at: status === "closed" ? new Date().toISOString() : null,
      })
      .eq("id", conversationId);

    await createAdminLog({
      action: "update_support_conversation_status",
      targetType: "support_conversation",
      targetId: conversationId,
      metadata: { status },
    });

    await loadSupportConversations();
    setActionLoading(null);
  }

  async function sendSupportReply() {
    const conversation =
      supportConversations.find((item: any) => item.id === selectedConversationId) ||
      null;
    const adminId = await getCurrentUserId();

    if (
      !conversation ||
      !adminId ||
      !conversationReply.trim() ||
      conversation.status === "closed"
    )
      return;

    setActionLoading(conversation.id);

    await supabase.from("support_messages").insert({
      conversation_id: conversation.id,
      sender_id: adminId,
      sender_role: "admin",
      message: conversationReply.trim(),
    });

    setConversationReply("");
    await loadSupportConversations();
    await loadSupportMessages(conversation.id);
    setActionLoading(null);
  }

  async function loadLogs() {
    const { data } = await supabase
      .from("admin_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80);

    setLogs((data || []) as AdminLog[]);
  }

  async function loadStats() {
    const [
      { count: visits },
      { count: conqueredCards },
      { count: openedPacks },
      { count: creatorFollows },
      { count: pendingRequests },
      { count: pendingClaims },
      { count: totalCreators },
      { count: totalUsers },
    ] = await Promise.all([
      supabase
        .from("creator_views")
        .select("id", { count: "exact", head: true }),
      supabase.from("user_cards").select("id", { count: "exact", head: true }),
      supabase
        .from("user_packs")
        .select("id", { count: "exact", head: true })
        .not("opened_at", "is", null),
      supabase
        .from("creator_followers")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("creator_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("creator_claims")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("creator_profiles")
        .select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    setStats({
      visits: visits || 0,
      logins: totalUsers || 0,
      conqueredCards: conqueredCards || 0,
      openedPacks: openedPacks || 0,
      creatorFollows: creatorFollows || 0,
      pendingRequests: pendingRequests || 0,
      pendingClaims: pendingClaims || 0,
      totalCreators: totalCreators || 0,
    });
  }

  async function loadPanel() {
    setLoading(true);

    await Promise.all([
      loadRequests(),
      loadUsers(),
      loadCreators(),
      loadClaims(),
      loadPartnerships(),
      loadSupportConversations(),
      loadLogs(),
      loadStats(),
    ]);

    setLoading(false);
  }

  useEffect(() => {
    if (open) {
      loadPanel();
    }
  }, [open]);

  useEffect(() => {
    if (!imageEditorFile) {
      setImageEditorObjectUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(imageEditorFile);
    setImageEditorObjectUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageEditorFile]);

  useEffect(() => {
    if (open && activeTab === "conversations") {
      loadSupportMessages(selectedConversationId);
    }
  }, [open, activeTab, selectedConversationId]);

  const usersById = useMemo(() => {
    return new Map(users.map((user: any) => [user.id, user]));
  }, [users]);

  const creatorsById = useMemo(() => {
    return new Map(creators.map((creator: any) => [creator.id, creator]));
  }, [creators]);

  function getOwner(userId: string | null) {
    if (!userId) return null;
    return usersById.get(userId) || null;
  }

  function getCreator(creatorId: string | null) {
    if (!creatorId) return null;
    return creatorsById.get(creatorId) || null;
  }

  async function approveRequest(request: CreatorRequest) {
    setActionLoading(request.id);

    const adminId = await getCurrentUserId();

    if (!adminId) {
      setActionLoading(null);
      return;
    }

    const { data: creatorProfile, error: profileError } = await supabase
      .from("creator_profiles")
      .insert({
        user_id: request.user_id,
        request_id: request.id,
        nickname: request.nickname,
        username: request.username,
        title: "Criador em Ascensão",
        faction: "Cardpoc",
        category: request.category || "Criador de Conteúdo",
        status: "offline",
        avatar_url: request.card_image_url,
        banner_url: request.card_image_url,
        bio: "Novo criador aprovado na plataforma.",
        description:
          "Este perfil foi aprovado e poderá ser personalizado pelo criador em breve.",
        tags: [],
        is_public: true,
        is_verified: false,
        owner_status: "claimed",
      })
      .select("id")
      .single();

    if (profileError || !creatorProfile) {
      setActionLoading(null);
      alert(
        profileError?.message ||
          translate(
            t,
            "adminCreateCreatorProfileError",
            "Erro ao criar o perfil do criador.",
          ),
      );
      return;
    }

    const { error: cardError } = await supabase.from("creator_cards").insert({
      creator_id: creatorProfile.id,
      rarity: "common",
      rank: "Bronze",
      aura: "Origin Aura",
      evolution_stage: "Stage 1 — Rising Creator",
      level: 1,
      power_score: 0,
      frame_key: "default",
      theme_key: "origin",
    });

    if (cardError) {
      setActionLoading(null);
      alert(cardError.message);
      return;
    }

    await supabase
      .from("creator_requests")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
      })
      .eq("id", request.id);

    await createAdminLog({
      action: "approve_creator_request",
      targetType: "creator_request",
      targetId: request.id,
      metadata: {
        nickname: request.nickname,
        username: request.username,
        creator_profile_id: creatorProfile.id,
      },
    });

    setActionLoading(null);
    await loadPanel();
  }

  async function rejectRequest(request: CreatorRequest) {
    setActionLoading(request.id);

    const adminId = await getCurrentUserId();

    if (!adminId) {
      setActionLoading(null);
      return;
    }

    await supabase
      .from("creator_requests")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
      })
      .eq("id", request.id);

    await createAdminLog({
      action: "reject_creator_request",
      targetType: "creator_request",
      targetId: request.id,
      metadata: {
        nickname: request.nickname,
        username: request.username,
      },
    });

    setActionLoading(null);
    await loadPanel();
  }

  async function approveClaim(claim: CreatorClaim) {
    setActionLoading(claim.id);

    const adminId = await getCurrentUserId();

    if (!adminId) {
      setActionLoading(null);
      return;
    }

    const creator = getCreator(claim.creator_id);
    const claimant = getOwner(claim.user_id);

    const { error: creatorError } = await supabase
      .from("creator_profiles")
      .update({
        user_id: claim.user_id,
        owner_status: "claimed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", claim.creator_id);

    if (creatorError) {
      setActionLoading(null);
      alert(creatorError.message);
      return;
    }

    const { error: claimError } = await supabase
      .from("creator_claims")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
      })
      .eq("id", claim.id);

    if (claimError) {
      setActionLoading(null);
      alert(claimError.message);
      return;
    }

    await createAdminLog({
      action: "approve_creator_claim",
      targetType: "creator_claim",
      targetId: claim.id,
      metadata: {
        creator_id: claim.creator_id,
        creator_nickname: creator?.nickname,
        creator_username: creator?.username,
        claimant_id: claim.user_id,
        claimant_email: claimant?.email,
        verification_platform: claim.verification_platform,
        verification_url: claim.verification_url,
      },
    });

    setActionLoading(null);
    await loadPanel();
  }

  async function rejectClaim(claim: CreatorClaim) {
    setActionLoading(claim.id);

    const adminId = await getCurrentUserId();

    if (!adminId) {
      setActionLoading(null);
      return;
    }

    const creator = getCreator(claim.creator_id);
    const claimant = getOwner(claim.user_id);

    const { error } = await supabase
      .from("creator_claims")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
      })
      .eq("id", claim.id);

    if (error) {
      setActionLoading(null);
      alert(error.message);
      return;
    }

    await createAdminLog({
      action: "reject_creator_claim",
      targetType: "creator_claim",
      targetId: claim.id,
      metadata: {
        creator_id: claim.creator_id,
        creator_nickname: creator?.nickname,
        creator_username: creator?.username,
        claimant_id: claim.user_id,
        claimant_email: claimant?.email,
        verification_platform: claim.verification_platform,
        verification_url: claim.verification_url,
      },
    });

    setActionLoading(null);
    await loadPanel();
  }

  function openPartnershipApproval(partnership: CreatorPartnership) {
    const brand = partnership.brands;

    setBrandEnrichmentLoading(false);
    setBrandEnrichmentConfidence(null);
    setBrandEnrichmentSource(null);

    setPartnershipApprovalDraft({
      partnership,
      brandName: brand?.name || partnership.brand_name || "",
      brandLogoUrl: brand?.logo_url || "",
      brandWebsiteUrl: brand?.website_url || partnership.website_url || "",
      brandDescription: brand?.description || "",
      partnershipType: partnership.partnership_type || "sponsorship",
      campaignName: partnership.campaign_name || "",
      publicDescription:
        partnership.public_description ||
        translate(
          t,
          "adminPartnershipDefaultPublicDescription",
          "Parceria detectada automaticamente e verificada pela equipe Cardpoc.",
        ),
      websiteUrl: partnership.website_url || brand?.website_url || "",
      startDate:
        partnership.start_date ||
        (partnership.source_published_at
          ? new Date(partnership.source_published_at)
              .toISOString()
              .split("T")[0]
          : ""),

      endDate: partnership.end_date || "",
    });
  }

  function updatePartnershipApprovalDraft(
    field: keyof Omit<PartnershipApprovalDraft, "partnership">,
    value: string,
  ) {
    setPartnershipApprovalDraft((current) => {
      if (!current) return current;

      return {
        ...current,
        [field]: value,
      };
    });
  }

  async function enrichBrand() {
    if (!partnershipApprovalDraft?.brandName.trim()) return;

    try {
      setBrandEnrichmentLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/admin/enrich-brand", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          brandName: partnershipApprovalDraft.brandName,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.brand) {
        throw new Error(
          result?.error ||
            translate(
              t,
              "adminBrandEnrichmentError",
              "Não foi possível pesquisar os dados da marca.",
            ),
        );
      }

      setPartnershipApprovalDraft((current) =>
        current
          ? {
              ...current,
              brandName: result.brand.name || current.brandName,
              brandLogoUrl: result.brand.logo_url || current.brandLogoUrl,
              brandWebsiteUrl:
                result.brand.website_url || current.brandWebsiteUrl,
              websiteUrl:
                current.websiteUrl ||
                result.brand.website_url ||
                current.websiteUrl,
              brandDescription:
                result.brand.description || current.brandDescription,
            }
          : null,
      );

      setBrandEnrichmentConfidence(
        typeof result.brand.enrichment_confidence === "number"
          ? result.brand.enrichment_confidence
          : null,
      );
      setBrandEnrichmentSource(result.brand.enrichment_source || null);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : translate(
              t,
              "adminBrandEnrichmentError",
              "Não foi possível pesquisar os dados da marca.",
            ),
      );
    } finally {
      setBrandEnrichmentLoading(false);
    }
  }

  async function approvePartnership() {
    if (!partnershipApprovalDraft) return;

    const { partnership } = partnershipApprovalDraft;
    const normalizedBrandName = partnershipApprovalDraft.brandName.trim();
    const brandSlug = createSlug(normalizedBrandName);

    if (!normalizedBrandName || !brandSlug) {
      alert(
        translate(
          t,
          "adminPartnershipBrandRequired",
          "Informe o nome da marca antes de aprovar.",
        ),
      );
      return;
    }

    setActionLoading(partnership.id);

    const adminId = await getCurrentUserId();

    if (!adminId) {
      setActionLoading(null);
      return;
    }

    const creator = getCreator(partnership.creator_id);

    let brandId = partnership.brand_id;

    const { data: existingBrand, error: existingBrandError } = await supabase
      .from("brands")
      .select("id")
      .eq("slug", brandSlug)
      .maybeSingle();

    if (existingBrandError) {
      setActionLoading(null);
      alert(existingBrandError.message);
      return;
    }

    if (existingBrand?.id) {
      brandId = existingBrand.id;

      const { error: updateBrandError } = await supabase
        .from("brands")
        .update({
          name: normalizedBrandName,
          logo_url: partnershipApprovalDraft.brandLogoUrl.trim() || null,
          website_url: partnershipApprovalDraft.brandWebsiteUrl.trim() || null,
          description: partnershipApprovalDraft.brandDescription.trim() || null,
          enrichment_source: brandEnrichmentSource,
          enrichment_confidence: brandEnrichmentConfidence || 0,
          external_logo_source: partnershipApprovalDraft.brandLogoUrl.trim()
            ? "brand_enrichment"
            : null,
          last_enriched_at:
            brandEnrichmentConfidence !== null
              ? new Date().toISOString()
              : null,
        })
        .eq("id", existingBrand.id);

      if (updateBrandError) {
        setActionLoading(null);
        alert(updateBrandError.message);
        return;
      }
    } else {
      const { data: createdBrand, error: createBrandError } = await supabase
        .from("brands")
        .insert({
          name: normalizedBrandName,
          slug: brandSlug,
          logo_url: partnershipApprovalDraft.brandLogoUrl.trim() || null,
          website_url: partnershipApprovalDraft.brandWebsiteUrl.trim() || null,
          description: partnershipApprovalDraft.brandDescription.trim() || null,
          enrichment_source: brandEnrichmentSource,
          enrichment_confidence: brandEnrichmentConfidence || 0,
          external_logo_source: partnershipApprovalDraft.brandLogoUrl.trim()
            ? "brand_enrichment"
            : null,
          last_enriched_at:
            brandEnrichmentConfidence !== null
              ? new Date().toISOString()
              : null,
        })
        .select("id")
        .single();

      if (createBrandError) {
        setActionLoading(null);
        alert(createBrandError.message);
        return;
      }

      brandId = createdBrand.id;
    }

    const { error } = await supabase
      .from("creator_partnerships")
      .update({
        brand_id: brandId,
        brand_name: normalizedBrandName,
        partnership_type: partnershipApprovalDraft.partnershipType,
        campaign_name: partnershipApprovalDraft.campaignName.trim() || null,
        public_description:
          partnershipApprovalDraft.publicDescription.trim() || null,
        website_url:
          partnershipApprovalDraft.websiteUrl.trim() ||
          partnershipApprovalDraft.brandWebsiteUrl.trim() ||
          null,
        start_date: partnershipApprovalDraft.startDate || null,
        end_date: partnershipApprovalDraft.endDate || null,
        status: "verified",
        verified_by: adminId,
        verified_at: new Date().toISOString(),
        rejected_by: null,
        rejected_at: null,
      })
      .eq("id", partnership.id);

    if (error) {
      setActionLoading(null);
      alert(error.message);
      return;
    }

    await createAdminLog({
      action: "approve_creator_partnership",
      targetType: "creator_partnership",
      targetId: partnership.id,
      metadata: {
        creator_id: partnership.creator_id,
        creator_nickname: creator?.nickname,
        creator_username: creator?.username,
        brand_id: brandId,
        brand_name: normalizedBrandName,
        partnership_type: partnershipApprovalDraft.partnershipType,
        campaign_name: partnershipApprovalDraft.campaignName,
        source_platform: partnership.source_platform,
        source_url: partnership.source_url,
        confidence_score: partnership.confidence_score,
      },
    });

    setPartnershipApprovalDraft(null);
    setBrandEnrichmentConfidence(null);
    setBrandEnrichmentSource(null);
    setActionLoading(null);
    await loadPartnerships();
    await loadLogs();
    showAdminSuccess(
      translate(
        t,
        "adminPartnershipApprovedSuccess",
        "Parceria aprovada com sucesso.",
      ),
    );
  }

  async function rejectPartnership(partnership: CreatorPartnership) {
    setActionLoading(partnership.id);

    const adminId = await getCurrentUserId();

    if (!adminId) {
      setActionLoading(null);
      return;
    }

    const creator = getCreator(partnership.creator_id);

    const { error } = await supabase
      .from("creator_partnerships")
      .update({
        status: "rejected",
        rejected_by: adminId,
        rejected_at: new Date().toISOString(),
      })
      .eq("id", partnership.id);

    if (error) {
      setActionLoading(null);
      alert(error.message);
      return;
    }

    await createAdminLog({
      action: "reject_creator_partnership",
      targetType: "creator_partnership",
      targetId: partnership.id,
      metadata: {
        creator_id: partnership.creator_id,
        creator_nickname: creator?.nickname,
        creator_username: creator?.username,
        brand_name: partnership.brand_name,
        partnership_type: partnership.partnership_type,
        source_platform: partnership.source_platform,
        source_url: partnership.source_url,
        confidence_score: partnership.confidence_score,
      },
    });

    setActionLoading(null);
    await loadPartnerships();
    await loadLogs();
    showAdminSuccess(
      translate(t, "adminPartnershipRejectedSuccess", "Parceria rejeitada."),
    );
  }

  async function detectYouTubePartnerships() {
    setActionLoading("detect-youtube-partnerships");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/admin/detect-youtube-partnerships", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            translate(
              t,
              "adminPartnershipDetectionError",
              "Não foi possível detectar parcerias do YouTube agora.",
            ),
        );
      }

      await loadPartnerships();
      await loadLogs();

      showAdminSuccess(
        translate(
          t,
          "adminPartnershipDetectionSuccess",
          "Detecção do YouTube concluída.",
        ),
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : translate(
              t,
              "adminPartnershipDetectionError",
              "Não foi possível detectar parcerias do YouTube agora.",
            ),
      );
    } finally {
      setActionLoading(null);
    }
  }

  function getCreatorDetectorPlatformLabel(
    platform: CreatorDetectorPlatform = creatorDetectorPlatform,
  ) {
    return platform === "twitch" ? "Twitch" : "Kick";
  }

  function getDetectedKickKey(creator: DetectedKickCreator) {
    return `${creator.platform || creatorDetectorPlatform}:${String(
      creator.slug || creator.username || creator.id || "",
    ).toLowerCase()}`;
  }

  function normalizeDetectorCompare(value: unknown) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/^@/, "")
      .replace(/[^a-z0-9]/g, "")
      .replace(/(tv|live|oficial|official)$/g, "");
  }

  function getNameSimilarity(first: string, second: string) {
    if (!first || !second) return 0;
    if (first === second) return 1;

    const shorter = first.length <= second.length ? first : second;
    const longer = first.length > second.length ? first : second;

    if (shorter.length >= 5 && longer.startsWith(shorter)) return 0.94;
    if (shorter.length >= 5 && longer.includes(shorter)) return 0.88;

    const distances = Array.from({ length: shorter.length + 1 }, (_, index) =>
      index,
    );

    for (let i = 1; i <= longer.length; i += 1) {
      let previous = i;
      for (let j = 1; j <= shorter.length; j += 1) {
        const current = distances[j];
        distances[j] =
          longer[i - 1] === shorter[j - 1]
            ? previous
            : Math.min(previous, distances[j], distances[j - 1]) + 1;
        previous = current;
      }
      distances[0] = i;
    }

    return 1 - distances[shorter.length] / Math.max(first.length, second.length);
  }

  function getPossibleCreatorMatches(creator: DetectedKickCreator) {
    const detectedNames = [
      creator.slug,
      creator.username,
      creator.display_name,
    ]
      .map(normalizeDetectorCompare)
      .filter(Boolean);

    if (detectedNames.length === 0) return [];

    return creators
      .map((existingCreator: any) => {
        const existingNames = [
          existingCreator.username,
          existingCreator.nickname,
        ]
          .map(normalizeDetectorCompare)
          .filter(Boolean);

        const score = Math.max(
          0,
          ...detectedNames.flatMap((detectedName) =>
            existingNames.map((existingName: any) =>
              getNameSimilarity(detectedName, existingName),
            ),
          ),
        );

        return { creator: existingCreator, score };
      })
      .filter((match: any) => match.score >= 0.78)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 3);
  }

  function toggleDetectedKickCreator(creator: DetectedKickCreator) {
    const key = getDetectedKickKey(creator);
    if (!key || creator.already_exists) return;

    setSelectedDetectedKickCreators((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  async function detectKickCreators() {
    setActionLoading("detect-kick-creators");

    try {
      const {
        data: { session: detectorSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !detectorSession?.access_token) {
        alert(
          translate(
            t,
            "adminCreatorDetectorInvalidSession",
            "Sessão inválida. Faça login novamente.",
          ),
        );
        return;
      }

      const requestBody = JSON.stringify({
        category: kickDetectorCategory.trim(),
        language: kickDetectorLanguage.trim() || null,
        minViewers: Number(kickDetectorMinViewers || 0),
        limit: Number(kickDetectorLimit || 50),
      });

      const endpoints: {
        platform: CreatorDetectorPlatform;
        url: string;
      }[] = [
        { platform: "kick", url: "/api/admin/detect-kick-creators" },
        { platform: "twitch", url: "/api/admin/detect-twitch-creators" },
      ];

      const responses = await Promise.all(
        endpoints.map(async (endpoint) => {
          const response = await fetch(endpoint.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${detectorSession.access_token}`,
            },
            body: requestBody,
          });

          const result = await response.json().catch(() => null);

          if (!response.ok) {
            return {
              platform: endpoint.platform,
              error:
                result?.error ||
                translate(
                  t,
                  "adminCreatorDetectorDetectionError",
                  "Não foi possível detectar criadores agora.",
                ),
              creators: [] as DetectedKickCreator[],
            };
          }

          return {
            platform: endpoint.platform,
            error: null,
            creators: Array.isArray(result?.creators)
              ? (result.creators as DetectedKickCreator[])
              : [],
          };
        }),
      );

      const creatorsResult = responses.flatMap((response) =>
        response.creators.map((creator: any) => ({
          ...creator,
          platform: creator.platform || response.platform,
        })),
      );

      const uniqueCreators = Array.from(
        new Map(
          creatorsResult.map((creator: any) => [
            getDetectedKickKey(creator),
            creator,
          ]),
        ).values(),
      ).sort(
        (first, second) =>
          Number(second.viewer_count || 0) - Number(first.viewer_count || 0),
      );

      setDetectedKickCreators(uniqueCreators);
      setSelectedDetectedKickCreators({});

      const failedPlatforms = responses.filter((response: any) => response.error);

      if (failedPlatforms.length > 0 && uniqueCreators.length === 0) {
        throw new Error(failedPlatforms.map((item: any) => item.error).join(" | "));
      }

      if (failedPlatforms.length > 0) {
        alert(
          `${translate(
            t,
            "adminCreatorDetectorPartialDetection",
            "Busca parcial concluída. Uma plataforma retornou erro:",
          )} ${failedPlatforms
            .map((item: any) => `${getCreatorDetectorPlatformLabel(item.platform)}: ${item.error}`)
            .join(" | ")}`,
        );
      }

      showAdminSuccess(
        translate(
          t,
          "adminCreatorDetectorDetectionSuccess",
          "Detecção concluída.",
        ),
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : translate(
              t,
              "adminCreatorDetectorDetectionError",
              "Não foi possível detectar criadores agora.",
            ),
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function importSelectedKickCreators() {
    const selectedCreators = detectedKickCreators.filter(
      (creator) =>
        selectedDetectedKickCreators[getDetectedKickKey(creator)] &&
        !creator.already_exists,
    );

    if (selectedCreators.length === 0) return;

    setActionLoading("import-kick-creators");

    try {
      const {
        data: { session: detectorSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !detectorSession?.access_token) {
        alert(
          translate(
            t,
            "adminCreatorDetectorInvalidSession",
            "Sessão inválida. Faça login novamente.",
          ),
        );
        return;
      }

      const creatorsByPlatform = selectedCreators.reduce(
        (groups, creator) => {
          const platform = creator.platform || "kick";
          groups[platform].push({
            ...creator,
            platform,
          });
          return groups;
        },
        {
          kick: [] as DetectedKickCreator[],
          twitch: [] as DetectedKickCreator[],
        },
      );

      const importEndpoints = (
        [
          {
            platform: "kick" as const,
            url: "/api/admin/import-kick-creators",
            creators: creatorsByPlatform.kick,
          },
          {
            platform: "twitch" as const,
            url: "/api/admin/import-twitch-creators",
            creators: creatorsByPlatform.twitch,
          },
        ] satisfies {
          platform: CreatorDetectorPlatform;
          url: string;
          creators: DetectedKickCreator[];
        }[]
      ).filter((endpoint: any) => endpoint.creators.length > 0);

      const responses = await Promise.all(
        importEndpoints.map(async (endpoint) => {
          const response = await fetch(endpoint.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${detectorSession.access_token}`,
            },
            body: JSON.stringify({
              creators: endpoint.creators,
            }),
          });

          const result = await response.json().catch(() => null);

          if (!response.ok) {
            throw new Error(
              result?.error ||
                `${getCreatorDetectorPlatformLabel(endpoint.platform)}: ${translate(
                  t,
                  "adminCreatorDetectorImportError",
                  "Não foi possível importar os criadores selecionados.",
                )}`,
            );
          }

          return result;
        }),
      );

      await loadCreators();
      await loadLogs();
      setSelectedDetectedKickCreators({});
      setDetectedKickCreators((current) =>
        current.map((creator: any) =>
          selectedDetectedKickCreators[getDetectedKickKey(creator)]
            ? { ...creator, already_exists: true }
            : creator,
        ),
      );

      showAdminSuccess(
        translate(
          t,
          "adminCreatorDetectorImportSuccess",
          "Criadores importados como rascunho.",
        ),
      );

      return responses;
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : translate(
              t,
              "adminCreatorDetectorImportError",
              "Não foi possível importar os criadores selecionados.",
            ),
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function linkDetectedCreatorToExisting(
    detectedCreator: DetectedKickCreator,
    existingCreator: CreatorProfile,
  ) {
    const key = getDetectedKickKey(detectedCreator);
    const platform = detectedCreator.platform || creatorDetectorPlatform;

    setLinkingDetectedCreatorKey(`${key}:${existingCreator.id}`);

    try {
      const {
        data: { session: detectorSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !detectorSession?.access_token) {
        alert(
          translate(
            t,
            "adminCreatorDetectorInvalidSession",
            "Sessão inválida. Faça login novamente.",
          ),
        );
        return;
      }

      const response = await fetch("/api/admin/link-detected-creator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${detectorSession.access_token}`,
        },
        body: JSON.stringify({
          creator_id: existingCreator.id,
          platform,
          slug: detectedCreator.slug || detectedCreator.username,
          url:
            detectedCreator.url ||
            (platform === "twitch"
              ? `https://www.twitch.tv/${detectedCreator.slug}`
              : `https://kick.com/${detectedCreator.slug}`),
          followers_count: detectedCreator.followers_count ?? null,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            translate(
              t,
              "adminCreatorDetectorLinkError",
              "Não foi possível vincular a rede social ao perfil existente.",
            ),
        );
      }

      setSelectedDetectedKickCreators((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });

      setDetectedKickCreators((current) =>
        current.map((creator: any) =>
          getDetectedKickKey(creator) === key
            ? { ...creator, already_exists: true }
            : creator,
        ),
      );

      showAdminSuccess(
        translate(
          t,
          "adminCreatorDetectorLinkSuccess",
          "Rede social vinculada ao perfil existente.",
        ),
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : translate(
              t,
              "adminCreatorDetectorLinkError",
              "Não foi possível vincular a rede social ao perfil existente.",
            ),
      );
    } finally {
      setLinkingDetectedCreatorKey(null);
    }
  }

  async function toggleAdmin(targetUser: ProfileUser) {
    setActionLoading(targetUser.id);

    const newAdminValue = !targetUser.is_admin;

    const { error } = await supabase
      .from("profiles")
      .update({
        is_admin: newAdminValue,
      })
      .eq("id", targetUser.id);

    if (error) {
      setActionLoading(null);
      alert(error.message);
      return;
    }

    await createAdminLog({
      action: newAdminValue ? "promote_user_admin" : "remove_user_admin",
      targetType: "profile",
      targetId: targetUser.id,
      metadata: {
        email: targetUser.email,
        display_name: targetUser.display_name,
        username: targetUser.username,
      },
    });

    setActionLoading(null);
    await loadUsers();
    await loadLogs();
  }

  async function toggleUserBan(targetUser: ProfileUser) {
    setActionLoading(targetUser.id);

    const newBannedValue = !targetUser.is_banned;

    const { error } = await supabase
      .from("profiles")
      .update({
        is_banned: newBannedValue,
      })
      .eq("id", targetUser.id);

    if (error) {
      setActionLoading(null);
      alert(error.message);
      return;
    }

    await createAdminLog({
      action: newBannedValue ? "ban_user" : "unban_user",
      targetType: "profile",
      targetId: targetUser.id,
      metadata: {
        email: targetUser.email,
        display_name: targetUser.display_name,
        username: targetUser.username,
      },
    });

    setActionLoading(null);
    await loadUsers();
    await loadLogs();
    showAdminSuccess(
      newBannedValue
        ? translate(t, "adminUserBannedSuccess", "Usuário banido com sucesso.")
        : translate(
            t,
            "adminUserUnbannedSuccess",
            "Usuário desbanido com sucesso.",
          ),
    );
  }

  async function toggleCreatorPublic(creator: CreatorProfile) {
    setActionLoading(creator.id);

    const newValue = !creator.is_public;

    const { error } = await supabase
      .from("creator_profiles")
      .update({
        is_public: newValue,
      })
      .eq("id", creator.id);

    if (error) {
      setActionLoading(null);
      alert(error.message);
      return;
    }

    await createAdminLog({
      action: newValue ? "publish_creator_profile" : "hide_creator_profile",
      targetType: "creator_profile",
      targetId: creator.id,
      metadata: {
        nickname: creator.nickname,
        username: creator.username,
      },
    });

    setActionLoading(null);
    await loadCreators();
    await loadLogs();
  }

  async function toggleCreatorVerified(creator: CreatorProfile) {
    setActionLoading(creator.id);

    const newValue = !creator.is_verified;

    const { error } = await supabase
      .from("creator_profiles")
      .update({
        is_verified: newValue,
      })
      .eq("id", creator.id);

    if (error) {
      setActionLoading(null);
      alert(error.message);
      return;
    }

    await createAdminLog({
      action: newValue ? "verify_creator_profile" : "unverify_creator_profile",
      targetType: "creator_profile",
      targetId: creator.id,
      metadata: {
        nickname: creator.nickname,
        username: creator.username,
      },
    });

    setActionLoading(null);
    await loadCreators();
    await loadLogs();
  }

  async function bulkUpdateFilteredCreators(
    updates: Partial<
      Pick<CreatorProfile, "is_public" | "is_verified">
    >,
    action: string,
    successMessage: string,
  ) {
    const targetCreators = filteredCreators.filter((creator: any) => {
      if (
        typeof updates.is_public === "boolean" &&
        creator.is_public === updates.is_public
      ) {
        return false;
      }

      if (
        typeof updates.is_verified === "boolean" &&
        creator.is_verified === updates.is_verified
      ) {
        return false;
      }

      return true;
    });

    if (targetCreators.length === 0) {
      alert(
        translate(
          t,
          "adminNoFilteredProfilesToUpdate",
          "Nenhum perfil filtrado precisa dessa alteração.",
        ),
      );
      return;
    }

    const confirmed = window.confirm(
      translate(
        t,
        "adminConfirmBulkCreatorUpdate",
        `Aplicar esta alteração em ${targetCreators.length} perfil(is) filtrado(s)?`,
      ),
    );

    if (!confirmed) return;

    setActionLoading(action);

    const { error } = await supabase
      .from("creator_profiles")
      .update(updates)
      .in(
        "id",
        targetCreators.map((creator: any) => creator.id),
      );

    if (error) {
      setActionLoading(null);
      alert(error.message);
      return;
    }

    await createAdminLog({
      action,
      targetType: "creator_profile",
      targetId: null,
      metadata: {
        updates,
        affected_count: targetCreators.length,
        affected_ids: targetCreators.map((creator: any) => creator.id),
        filters: {
          search: creatorSearch,
          visibility: creatorVisibilityFilter,
          verification: creatorVerificationFilter,
          owner: creatorOwnerFilter,
          sort: creatorSortFilter,
        },
      },
    });

    setActionLoading(null);
    await loadCreators();
    await loadLogs();
    showAdminSuccess(successMessage);
  }

  function openCreatorImageEditor(creator: CreatorProfile) {
    setImageEditorCreator(creator);
    setImageEditorUrl(creator.avatar_url || "");
    setImageEditorFile(null);
  }

  function closeCreatorImageEditor() {
    setImageEditorCreator(null);
    setImageEditorUrl("");
    setImageEditorFile(null);
  }

  async function saveCreatorImage() {
    if (!imageEditorCreator) return;

    const trimmedUrl = imageEditorUrl.trim();

    if (!trimmedUrl && !imageEditorFile) {
      alert(
        translate(
          t,
          "adminCreatorImageRequired",
          "Informe uma URL ou selecione uma imagem para upload.",
        ),
      );
      return;
    }

    setActionLoading(`creator-image-${imageEditorCreator.id}`);

    let nextAvatarUrl = trimmedUrl;

    if (imageEditorFile) {
      const extension =
        imageEditorFile.name.split(".").pop()?.toLowerCase() || "webp";
      const safeUsername = imageEditorCreator.username
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      const filePath = `${imageEditorCreator.id}/${safeUsername || "creator"}-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(CREATOR_IMAGE_BUCKET)
        .upload(filePath, imageEditorFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        setActionLoading(null);
        alert(uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from(CREATOR_IMAGE_BUCKET)
        .getPublicUrl(filePath);

      nextAvatarUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase
      .from("creator_profiles")
      .update({ avatar_url: nextAvatarUrl })
      .eq("id", imageEditorCreator.id);

    if (error) {
      setActionLoading(null);
      alert(error.message);
      return;
    }

    await createAdminLog({
      action: "update_creator_avatar",
      targetType: "creator_profile",
      targetId: imageEditorCreator.id,
      metadata: {
        nickname: imageEditorCreator.nickname,
        username: imageEditorCreator.username,
        image_source: imageEditorFile ? "upload" : "url",
      },
    });

    closeCreatorImageEditor();
    setActionLoading(null);
    await loadCreators();
    await loadLogs();
    showAdminSuccess(
      translate(t, "adminCreatorImageUpdated", "Imagem do perfil atualizada."),
    );
  }

  async function removeCreatorOwner(creator: CreatorProfile) {
    setActionLoading(creator.id);

    const { error } = await supabase
      .from("creator_profiles")
      .update({
        user_id: null,
        owner_status: "unclaimed",
        image_usage_consent: false,
        image_usage_consent_at: null,
        image_usage_consent_version: null,
        image_usage_consent_source: "admin_reset",
        image_usage_consent_text: null,
      })
      .eq("id", creator.id);

    if (error) {
      setActionLoading(null);
      alert(error.message);
      return;
    }

    await createAdminLog({
      action: "remove_creator_owner",
      targetType: "creator_profile",
      targetId: creator.id,
      metadata: {
        nickname: creator.nickname,
        username: creator.username,
        previous_owner: creator.user_id,
      },
    });

    setActionLoading(null);
    await loadCreators();
    await loadLogs();
  }

  async function changeCreatorOwner(creator: CreatorProfile, userId: string) {
    setActionLoading(creator.id);

    const newOwner = users.find((user: any) => user.id === userId);

    const { error } = await supabase
      .from("creator_profiles")
      .update({
        user_id: userId || null,
        owner_status: userId ? "claimed" : "unclaimed",
        ...(userId
          ? {}
          : {
              image_usage_consent: false,
              image_usage_consent_at: null,
              image_usage_consent_version: null,
              image_usage_consent_source: "admin_reset",
              image_usage_consent_text: null,
            }),
      })
      .eq("id", creator.id);

    if (error) {
      setActionLoading(null);
      alert(error.message);
      return;
    }

    await createAdminLog({
      action: "change_creator_owner",
      targetType: "creator_profile",
      targetId: creator.id,
      metadata: {
        nickname: creator.nickname,
        username: creator.username,
        new_owner_id: userId,
        new_owner_email: newOwner?.email,
      },
    });

    setActionLoading(null);
    await loadCreators();
    await loadLogs();
  }

  function getAdminRewardTargets() {
    if (adminRewardTarget === "all_users") {
      return users.filter((user: any) => Boolean(user.id));
    }

    const selectedUser = users.find((user: any) => user.id === selectedCardUserId);

    return selectedUser ? [selectedUser] : [];
  }

  function getSafeQuantity(value: number) {
    if (!Number.isFinite(value)) return 1;

    return Math.max(1, Math.min(100, Math.floor(value)));
  }

  function getProfileDisplayName(profile: ProfileUser) {
    return (
      profile.display_name ||
      profile.username ||
      profile.email ||
      translate(t, "user", "Usuário")
    );
  }

  function showAdminSuccess(message: string) {
    setSuccessToast(message);
    window.setTimeout(() => setSuccessToast(null), 3200);
  }

  function getTabCounter(tabId: Tab) {
    if (tabId === "requests") return requests.length;
    if (tabId === "users") return users.length;
    if (tabId === "creators") return creators.length;
    if (tabId === "creatorDetector") return detectedKickCreators.length || null;
    if (tabId === "cards")
      return `${userCardsCount} ${translate(t, "adminCardsPacksShort", "Cartas/Pacotes")}`;
    if (tabId === "claims") return claims.length;
    if (tabId === "partnerships") return partnerships.length;
    if (tabId === "conversations")
      return supportConversations.filter((conversation: any) =>
        ACTIVE_SUPPORT_STATUSES.includes(conversation.status),
      ).length;
    if (tabId === "logs") return activeTab === "logs" ? null : logs.length;
    if (tabId === "statistics") return null;

    return null;
  }

  function getFriendlyLogTitle(log: AdminLog) {
    const metadata = log.metadata || {};
    const actor = getOwner(log.admin_id);
    const actorName =
      actor?.display_name ||
      actor?.username ||
      actor?.email ||
      translate(t, "system", "Sistema");

    const creatorName =
      typeof metadata.creator_nickname === "string"
        ? metadata.creator_nickname
        : typeof metadata.nickname === "string"
          ? metadata.nickname
          : null;

    const targetName =
      creatorName ||
      (typeof metadata.email === "string" ? metadata.email : null) ||
      (typeof metadata.target_user_email === "string"
        ? metadata.target_user_email
        : null) ||
      translate(t, "adminUnknownTarget", "um item");

    const actionMap: Record<string, string> = {
      approve_creator_request: translate(
        t,
        "adminActivityApprovedRequest",
        "{actor} aprovou a solicitação de {target}.",
      ),
      reject_creator_request: translate(
        t,
        "adminActivityRejectedRequest",
        "{actor} rejeitou a solicitação de {target}.",
      ),
      approve_creator_claim: translate(
        t,
        "adminActivityApprovedClaim",
        "{actor} aprovou a reivindicação de {target}.",
      ),
      reject_creator_claim: translate(
        t,
        "adminActivityRejectedClaim",
        "{actor} rejeitou a reivindicação de {target}.",
      ),
      grant_user_card: translate(
        t,
        "adminActivitySentCard",
        "{actor} enviou carta para {target}.",
      ),
      giveaway_cards: translate(
        t,
        "adminActivityGiveawayCards",
        "{actor} enviou cartas em giveaway.",
      ),
      grant_user_pack: translate(
        t,
        "adminActivitySentPack",
        "{actor} enviou pacote para {target}.",
      ),
      giveaway_packs: translate(
        t,
        "adminActivityGiveawayPacks",
        "{actor} enviou pacotes em giveaway.",
      ),
      approve_creator_partnership: translate(
        t,
        "adminActivityApprovedPartnership",
        "{actor} aprovou a parceria de {target}.",
      ),
      reject_creator_partnership: translate(
        t,
        "adminActivityRejectedPartnership",
        "{actor} rejeitou a parceria de {target}.",
      ),
      ban_user: translate(
        t,
        "adminActivityBannedUser",
        "{actor} baniu {target}.",
      ),
      unban_user: translate(
        t,
        "adminActivityUnbannedUser",
        "{actor} desbaniu {target}.",
      ),
    };

    return (
      actionMap[log.action] ||
      translate(
        t,
        "adminActivityGeneric",
        "{actor} realizou uma ação administrativa em {target}.",
      )
    )
      .replace("{actor}", actorName)
      .replace("{target}", targetName);
  }

  async function grantCardToUser() {
    if (!selectedCardCreatorId) {
      alert(
        translate(
          t,
          "adminSelectCreatorCardFirst",
          "Selecione um criador/carta primeiro.",
        ),
      );
      return;
    }

    const selectedCreator = creators.find(
      (creator) => creator.id === selectedCardCreatorId,
    );

    if (!selectedCreator) {
      alert(
        translate(
          t,
          "adminCreatorOrUserNotFound",
          "Criador ou usuário não encontrado.",
        ),
      );
      return;
    }

    const targetUsers = getAdminRewardTargets();

    if (targetUsers.length === 0) {
      alert(
        adminRewardTarget === "all_users"
          ? translate(
              t,
              "adminNoUsersForGiveaway",
              "Nenhum usuário cadastrado encontrado para o giveaway.",
            )
          : translate(
              t,
              "adminSelectCardRecipient",
              "Selecione o usuário que vai receber a carta.",
            ),
      );
      return;
    }

    const quantity = getSafeQuantity(adminCardQuantity);
    const actionId = `grant-card-${selectedCardCreatorId}-${adminRewardTarget}-${selectedCardUserId || "all"}`;
    setActionLoading(actionId);

    for (const targetUser of targetUsers) {
      for (let index = 0; index < quantity; index += 1) {
        const finalRarity =
          selectedGrantRarity === "random"
            ? rollRandomRarity()
            : selectedGrantRarity;

        const { error } = await supabase.rpc("grant_user_card", {
          p_target_user_id: targetUser.id,
          p_creator_id: selectedCardCreatorId,
          p_rarity: finalRarity,
          p_source:
            adminRewardTarget === "all_users"
              ? "admin_giveaway"
              : selectedGrantRarity === "random"
                ? "admin_random_grant"
                : "admin_grant",
          p_selected_rarity: selectedGrantRarity,
        });

        if (error) {
          const isDuplicateCardError =
            error.code === "23505" ||
            error.message.toLowerCase().includes("duplicate key") ||
            error.message.toLowerCase().includes("user_cards_unique");

          if (isDuplicateCardError) {
            continue;
          }

          setActionLoading(null);
          alert(error.message);
          return;
        }
      }
    }

    await createAdminLog({
      action:
        adminRewardTarget === "all_users"
          ? "giveaway_cards"
          : "grant_user_card",
      targetType: adminRewardTarget === "all_users" ? "users" : "user_card",
      targetId: adminRewardTarget === "all_users" ? null : selectedCardUserId,
      metadata: {
        creator_id: selectedCreator.id,
        creator_nickname: selectedCreator.nickname,
        selected_rarity: selectedGrantRarity,
        quantity,
        target_mode: adminRewardTarget,
        target_users_count: targetUsers.length,
      },
    });

    setActionLoading(null);
    await loadLogs();

    showAdminSuccess(
      translate(
        t,
        adminRewardTarget === "all_users"
          ? "adminCardsGiveawaySuccess"
          : "adminCardSentSuccessWithQuantity",
        adminRewardTarget === "all_users"
          ? "Giveaway enviado! {quantity} carta(s) de {creator} foram entregues para {count} usuário(s)."
          : "Carta enviada! {quantity}x {creator} ({rarity}) foi entregue para {user}.",
      )
        .replace("{quantity}", String(quantity))
        .replace("{creator}", selectedCreator.nickname)
        .replace("{rarity}", getGrantRarityLabel(selectedGrantRarity, t))
        .replace("{count}", String(targetUsers.length))
        .replace(
          "{user}",
          targetUsers[0] ? getProfileDisplayName(targetUsers[0]) : "",
        ),
    );
  }

  async function grantPackToUser() {
    const targetUsers = getAdminRewardTargets();

    if (targetUsers.length === 0) {
      alert(
        adminRewardTarget === "all_users"
          ? translate(
              t,
              "adminNoUsersForGiveaway",
              "Nenhum usuário cadastrado encontrado para o giveaway.",
            )
          : translate(
              t,
              "adminSelectPackRecipient",
              "Selecione o usuário que vai receber o pacote.",
            ),
      );
      return;
    }

    const quantity = getSafeQuantity(adminPackQuantity);
    const actionId = `grant-pack-${selectedAdminPackType}-${adminRewardTarget}-${selectedCardUserId || "all"}`;
    setActionLoading(actionId);

    const { data: pack, error: packError } = await supabase
      .from("packs")
      .select("id, name, pack_type")
      .eq("pack_type", selectedAdminPackType)
      .eq("is_active", true)
      .single();

    if (packError || !pack) {
      setActionLoading(null);
      alert(
        packError?.message ||
          translate(
            t,
            "adminPackNotFound",
            "Pacote não encontrado ou inativo no banco de dados.",
          ),
      );
      return;
    }

    const grantedPackIds: string[] = [];

    for (const targetUser of targetUsers) {
      for (let index = 0; index < quantity; index += 1) {
        const { data: grantedPackId, error } = await supabase.rpc(
          "grant_user_pack",
          {
            p_target_user_id: targetUser.id,
            p_pack_id: pack.id,
            p_source:
              adminRewardTarget === "all_users"
                ? "admin_giveaway"
                : "admin_grant",
          },
        );

        if (error) {
          setActionLoading(null);
          alert(error.message);
          return;
        }

        if (grantedPackId) {
          grantedPackIds.push(String(grantedPackId));
        }
      }
    }

    await createAdminLog({
      action:
        adminRewardTarget === "all_users"
          ? "giveaway_packs"
          : "grant_user_pack",
      targetType: adminRewardTarget === "all_users" ? "users" : "user_pack",
      targetId:
        adminRewardTarget === "all_users" ? null : grantedPackIds[0] || pack.id,
      metadata: {
        target_user_id:
          adminRewardTarget === "user" ? selectedCardUserId : null,
        target_user_email:
          adminRewardTarget === "user" ? targetUsers[0]?.email : null,
        pack_id: pack.id,
        pack_name: pack.name,
        pack_type: selectedAdminPackType,
        quantity,
        target_mode: adminRewardTarget,
        target_users_count: targetUsers.length,
      },
    });

    setActionLoading(null);
    await loadLogs();

    showAdminSuccess(
      translate(
        t,
        adminRewardTarget === "all_users"
          ? "adminPacksGiveawaySuccess"
          : "adminPackSentSuccessWithQuantity",
        adminRewardTarget === "all_users"
          ? "Giveaway enviado! {quantity} pacote(s) {pack} foram entregues para {count} usuário(s)."
          : "Pacote enviado! {quantity}x {pack} foi entregue para {user}.",
      )
        .replace("{quantity}", String(quantity))
        .replace("{pack}", getAdminPackLabel(selectedAdminPackType, t))
        .replace("{count}", String(targetUsers.length))
        .replace(
          "{user}",
          targetUsers[0] ? getProfileDisplayName(targetUsers[0]) : "",
        ),
    );
  }

  const filteredRequests = requests.filter((request: any) => {
    const search = requestSearch.toLowerCase().trim();

    const searchableText = [
      request.nickname,
      request.username,
      request.email,
      request.category,
      request.verification_platform,
      request.verification_url,
      request.verification_code,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search);
  });

  const filteredUsers = users.filter((user: any) => {
    const search = userSearch.toLowerCase().trim();

    const searchableText = [user.email, user.display_name, user.username]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search);
  });

  const filteredCreators = creators
    .filter((creator: any) => {
      const search = creatorSearch.toLowerCase().trim();
      const owner = getOwner(creator.user_id);

      if (creatorVisibilityFilter === "public" && !creator.is_public) {
        return false;
      }

      if (creatorVisibilityFilter === "hidden" && creator.is_public) {
        return false;
      }

      if (creatorVerificationFilter === "verified" && !creator.is_verified) {
        return false;
      }

      if (
        creatorVerificationFilter === "not_verified" &&
        creator.is_verified
      ) {
        return false;
      }

      if (creatorOwnerFilter === "claimed" && !creator.user_id) {
        return false;
      }

      if (creatorOwnerFilter === "unclaimed" && creator.user_id) {
        return false;
      }

      const searchableText = [
        creator.nickname,
        creator.username,
        creator.title,
        creator.category,
        creator.owner_status,
        owner?.email,
        owner?.display_name,
        owner?.username,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    })
    .sort((first: any, second: any) => {
      if (creatorSortFilter === "oldest") {
        return (
          new Date(first.created_at).getTime() -
          new Date(second.created_at).getTime()
        );
      }

      if (creatorSortFilter === "name") {
        return String(first.nickname || first.username || "").localeCompare(
          String(second.nickname || second.username || ""),
          dateLocale,
        );
      }

      if (creatorSortFilter === "views") {
        return Number(second.views_count || 0) - Number(first.views_count || 0);
      }

      if (creatorSortFilter === "followers") {
        return (
          Number(second.followers_count || 0) -
          Number(first.followers_count || 0)
        );
      }

      if (creatorSortFilter === "shares") {
        return Number(second.share_count || 0) - Number(first.share_count || 0);
      }

      if (creatorSortFilter === "trending") {
        return (
          Number(second.trending_score || 0) -
          Number(first.trending_score || 0)
        );
      }

      return (
        new Date(second.created_at).getTime() -
        new Date(first.created_at).getTime()
      );
    });

  const creatorProfileStats = {
    total: creators.length,
    filtered: filteredCreators.length,
    public: creators.filter((creator: CreatorProfile) => creator.is_public).length,
    hidden: creators.filter((creator: CreatorProfile) => !creator.is_public).length,
    verified: creators.filter((creator: CreatorProfile) => creator.is_verified).length,
    notVerified: creators.filter((creator: CreatorProfile) => !creator.is_verified).length,
    claimed: creators.filter((creator: CreatorProfile) => Boolean(creator.user_id)).length,
    unclaimed: creators.filter((creator: CreatorProfile) => !creator.user_id).length,
  };

  const hasCreatorProfileFilters =
    creatorSearch.trim().length > 0 ||
    creatorVisibilityFilter !== "all" ||
    creatorVerificationFilter !== "all" ||
    creatorOwnerFilter !== "all" ||
    creatorSortFilter !== "newest";

  const filteredDetectedKickCreators = detectedKickCreators.filter(
    (creator) => {
      if (hideRegisteredDetectorCreators && creator.already_exists) {
        return false;
      }

      const search = kickDetectorSearch.toLowerCase().trim();

      const searchableText = [
        creator.platform,
        creator.slug,
        creator.username,
        creator.display_name,
        creator.category,
        creator.stream_title,
        creator.language,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    },
  );

  const selectedKickCreatorsCount = detectedKickCreators.filter(
    (creator) =>
      selectedDetectedKickCreators[getDetectedKickKey(creator)] &&
      !creator.already_exists,
  ).length;

  const filteredClaims = claims.filter((claim: any) => {
    const search = claimSearch.toLowerCase().trim();
    const creator = getCreator(claim.creator_id);
    const claimant = getOwner(claim.user_id);

    const searchableText = [
      creator?.nickname,
      creator?.username,
      claimant?.email,
      claimant?.display_name,
      claimant?.username,
      claim.verification_platform,
      claim.verification_url,
      claim.verification_code,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search);
  });

  const filteredPartnerships = partnerships.filter((partnership: any) => {
    const search = partnershipSearch.toLowerCase().trim();
    const creator = getCreator(partnership.creator_id);

    const searchableText = [
      partnership.brand_name,
      partnership.partnership_type,
      partnership.source_platform,
      partnership.source_url,
      partnership.evidence_text,
      partnership.detection_reason,
      creator?.nickname,
      creator?.username,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search);
  });

  const filteredCardCreators = creators.filter((creator: CreatorProfile) => {
    const search = cardCreatorSearch.toLowerCase().trim();
    const owner = getOwner(creator.user_id);

    const searchableText = [
      creator.nickname,
      creator.username,
      creator.title,
      creator.category,
      owner?.email,
      owner?.display_name,
      owner?.username,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search);
  });

  const filteredCardUsers = users.filter((user: any) => {
    const search = cardUserSearch.toLowerCase().trim();

    const searchableText = [user.email, user.display_name, user.username]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search);
  });

  const selectedCardCreator =
    creators.find((creator: any) => creator.id === selectedCardCreatorId) || null;

  const selectedCardUser =
    users.find((user: any) => user.id === selectedCardUserId) || null;

  const conversationStatusCounts = supportConversations.reduce<
    Record<SupportFilter, number>
  >(
    (accumulator, conversation) => {
      accumulator.all += 1;
      accumulator[conversation.status] += 1;
      return accumulator;
    },
    {
      active: 0,
      all: 0,
      open: 0,
      waiting_admin: 0,
      waiting_user: 0,
      resolved: 0,
      closed: 0,
    },
  );

  const activeSupportConversationCount = ACTIVE_SUPPORT_STATUSES.reduce(
    (total, status) => total + conversationStatusCounts[status],
    0,
  );

  conversationStatusCounts.active = activeSupportConversationCount;

  const filteredSupportConversations = supportConversations.filter(
    (conversation) => {
      const search = conversationSearch.toLowerCase().trim();
      const owner = getOwner(conversation.user_id);
      const creator = getCreator(conversation.creator_id);

      const matchesStatus =
        conversationStatusFilter === "all" ||
        (conversationStatusFilter === "active"
          ? ACTIVE_SUPPORT_STATUSES.includes(conversation.status)
          : conversation.status === conversationStatusFilter);

      const searchableText = [
        conversation.subject,
        conversation.type,
        conversation.status,
        owner?.email,
        owner?.display_name,
        owner?.username,
        creator?.nickname,
        creator?.username,
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && searchableText.includes(search);
    },
  );

  const selectedSupportConversation =
    filteredSupportConversations.find(
      (conversation) => conversation.id === selectedConversationId,
    ) ||
    filteredSupportConversations[0] ||
    null;

  useEffect(() => {
    if (activeTab !== "conversations") return;
    if (filteredSupportConversations.length === 0) {
      setSelectedConversationId(null);
      return;
    }

    const selectedStillVisible = filteredSupportConversations.some(
      (conversation) => conversation.id === selectedConversationId,
    );

    if (!selectedStillVisible) {
      setSelectedConversationId(filteredSupportConversations[0].id);
    }
  }, [
    activeTab,
    conversationStatusFilter,
    conversationSearch,
    supportConversations.length,
  ]);

  const filteredLogs = logs.filter((log: any) => {
    const search = logSearch.toLowerCase().trim();
    const admin = getOwner(log.admin_id);

    const searchableText = [
      log.action,
      log.target_type,
      log.target_id,
      admin?.email,
      admin?.display_name,
      JSON.stringify(log.metadata || {}),
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search);
  });


  return {
    ACTIVE_SUPPORT_STATUSES,
    ADMIN_PACK_TYPES,
    ADMIN_TABS,
    AnimatePresence,
    Ban,
    BarChart3,
    Check,
    ChevronDown,
    ChevronUp,
    EmptyBox,
    ExternalLink,
    Eye,
    EyeOff,
    FINAL_SUPPORT_STATUSES,
    GRANT_RARITIES,
    Gift,
    Handshake,
    History,
    ImageIcon,
    InfoBox,
    Link,
    MessageCircle,
    PARTNERSHIP_TYPE_OPTIONS,
    Package,
    RotateCcw,
    SUPPORT_STATUS_FILTERS,
    Search,
    SearchInput,
    Send,
    ShieldCheck,
    SmallInfo,
    StatCard,
    StatusPill,
    Upload,
    UserCog,
    UserInfo,
    X,
    actionLoading,
    activeSupportConversationCount,
    activeTab,
    adminCardQuantity,
    adminPackQuantity,
    adminRewardTarget,
    adminRewardType,
    approveClaim,
    approvePartnership,
    approveRequest,
    brandEnrichmentConfidence,
    brandEnrichmentLoading,
    brandEnrichmentSource,
    bulkUpdateFilteredCreators,
    cardCreatorSearch,
    cardUserSearch,
    changeCreatorOwner,
    claimSearch,
    claims,
    closeCreatorImageEditor,
    conversationReply,
    conversationSearch,
    conversationStatusCounts,
    conversationStatusFilter,
    createAdminLog,
    createSlug,
    creatorDetectorPlatform,
    creatorOwnerFilter,
    creatorProfileStats,
    creatorSearch,
    creatorSortFilter,
    creatorVerificationFilter,
    creatorVisibilityFilter,
    creators,
    creatorsById,
    dateLocale,
    detectKickCreators,
    detectYouTubePartnerships,
    detectedKickCreators,
    enrichBrand,
    expandedClaims,
    expandedCreators,
    expandedLogs,
    expandedPartnerships,
    expandedRequests,
    filteredCardCreators,
    filteredCardUsers,
    filteredClaims,
    filteredCreators,
    filteredDetectedKickCreators,
    filteredLogs,
    filteredPartnerships,
    filteredRequests,
    filteredSupportConversations,
    filteredUsers,
    getAdminPackLabel,
    getAdminRewardTargets,
    getCreator,
    getCreatorDetectorPlatformLabel,
    getCurrentUserId,
    getDateLocale,
    getDetectedKickKey,
    getFriendlyLogTitle,
    getGrantRarityLabel,
    getNameSimilarity,
    getOwner,
    getPartnershipTypeLabel,
    getPossibleCreatorMatches,
    getProfileDisplayName,
    getSafeQuantity,
    getSupportStatusLabel,
    getSupportTypeLabel,
    getTabCounter,
    grantCardToUser,
    grantPackToUser,
    hasCreatorProfileFilters,
    hideRegisteredDetectorCreators,
    imageEditorCreator,
    imageEditorFile,
    imageEditorObjectUrl,
    imageEditorUrl,
    importSelectedKickCreators,
    isSupportConversationFinal,
    kickDetectorCategory,
    kickDetectorLanguage,
    kickDetectorLimit,
    kickDetectorMinViewers,
    kickDetectorSearch,
    language,
    linkDetectedCreatorToExisting,
    linkingDetectedCreatorKey,
    loadClaims,
    loadCreators,
    loadLogs,
    loadPanel,
    loadPartnerships,
    loadRequests,
    loadStats,
    loadSupportConversations,
    loadSupportMessages,
    loadUsers,
    loading,
    logSearch,
    logs,
    motion,
    normalizeDetectorCompare,
    onClose,
    open,
    openCreatorImageEditor,
    openPartnershipApproval,
    partnershipApprovalDraft,
    partnershipSearch,
    partnerships,
    rejectClaim,
    rejectPartnership,
    rejectRequest,
    removeCreatorOwner,
    requestSearch,
    requests,
    rollRandomRarity,
    saveCreatorImage,
    selectedAdminPackType,
    selectedCardCreator,
    selectedCardCreatorId,
    selectedCardUser,
    selectedCardUserId,
    selectedConversationId,
    selectedDetectedKickCreators,
    selectedGrantRarity,
    selectedKickCreatorsCount,
    selectedOwners,
    selectedSupportConversation,
    sendSupportReply,
    setActionLoading,
    setActiveTab,
    setAdminCardQuantity,
    setAdminPackQuantity,
    setAdminRewardTarget,
    setAdminRewardType,
    setBrandEnrichmentConfidence,
    setBrandEnrichmentLoading,
    setBrandEnrichmentSource,
    setCardCreatorSearch,
    setCardUserSearch,
    setClaimSearch,
    setClaims,
    setConversationReply,
    setConversationSearch,
    setConversationStatusFilter,
    setCreatorDetectorPlatform,
    setCreatorOwnerFilter,
    setCreatorSearch,
    setCreatorSortFilter,
    setCreatorVerificationFilter,
    setCreatorVisibilityFilter,
    setCreators,
    setDetectedKickCreators,
    setExpandedClaims,
    setExpandedCreators,
    setExpandedLogs,
    setExpandedPartnerships,
    setExpandedRequests,
    setHideRegisteredDetectorCreators,
    setImageEditorCreator,
    setImageEditorFile,
    setImageEditorObjectUrl,
    setImageEditorUrl,
    setKickDetectorCategory,
    setKickDetectorLanguage,
    setKickDetectorLimit,
    setKickDetectorMinViewers,
    setKickDetectorSearch,
    setLinkingDetectedCreatorKey,
    setLoading,
    setLogSearch,
    setLogs,
    setPartnershipApprovalDraft,
    setPartnershipSearch,
    setPartnerships,
    setRequestSearch,
    setRequests,
    setSelectedAdminPackType,
    setSelectedCardCreatorId,
    setSelectedCardUserId,
    setSelectedConversationId,
    setSelectedDetectedKickCreators,
    setSelectedGrantRarity,
    setSelectedOwners,
    setStats,
    setSuccessToast,
    setSupportConversations,
    setSupportMessages,
    setUserCardsCount,
    setUserSearch,
    setUsers,
    showAdminSuccess,
    stats,
    successToast,
    supportConversations,
    supportMessages,
    t,
    toggleAdmin,
    toggleCreatorPublic,
    toggleCreatorVerified,
    toggleDetectedKickCreator,
    toggleUserBan,
    translate,
    translateExisting,
    updatePartnershipApprovalDraft,
    updateSupportConversationStatus,
    userCardsCount,
    userSearch,
    users,
    usersById
  };
}

export type AdminPanelContext = ReturnType<typeof useAdminPanelController>;

export function StatCard({
  label,
  value,
  hint,
  dateLocale,
}: {
  label: string;
  value: number;
  hint: string;
  dateLocale: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-white/35">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black text-white">
        {Number(value || 0).toLocaleString(dateLocale)}
      </p>
      <p className="mt-2 text-sm leading-5 text-white/45">{hint}</p>
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
      />

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-cyan-300/40"
      />
    </div>
  );
}

export function UserInfo({
  profile,
  t,
}: {
  profile: ProfileUser;
  t: TranslateFunction;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        {profile.avatar_url ? (
          <img
            loading="lazy"
            decoding="async"
            src={profile.avatar_url}
            alt={profile.display_name || translate(t, "avatar", "Avatar")}
            className="h-full w-full object-cover"
          />
        ) : (
          <UserCog className="text-white/35" />
        )}
      </div>

      <div>
        <p className="font-bold text-white">
          {profile.display_name || translate(t, "noName", "Sem nome")}
        </p>

        <p className="text-sm text-white/45">
          {profile.email || translate(t, "noEmailLower", "sem email")}
        </p>

        <p className="text-xs text-white/35">
          @{profile.username || translate(t, "noUsername", "sem_username")}
        </p>
      </div>
    </div>
  );
}

export function StatusPill({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "cyan" | "yellow" | "red" | "green";
}) {
  const toneClass =
    tone === "cyan"
      ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
      : tone === "green"
        ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
        : tone === "yellow"
          ? "border-yellow-300/20 bg-yellow-300/10 text-yellow-100"
          : tone === "red"
            ? "border-red-300/20 bg-red-300/10 text-red-100"
            : "border-white/10 bg-white/[0.04] text-white/60";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${toneClass}`}>
      {label}
    </span>
  );
}

export function InfoBox({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs text-white/40">{label}</p>
      <p
        className={`mt-1 font-bold ${
          highlight ? "tracking-[0.2em] text-cyan-100" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function SmallInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-white/30">
        {label}
      </p>
      <p className="mt-1 truncate">{value}</p>
    </div>
  );
}

export function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-white/60">
      {text}
    </div>
  );
}
