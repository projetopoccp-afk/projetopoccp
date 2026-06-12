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
import { AdminRequestsTab } from "@/components/admin/AdminRequestsTab";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { AdminCreatorsTab } from "@/components/admin/AdminCreatorsTab";
import { AdminCreatorDetectorTab } from "@/components/admin/AdminCreatorDetectorTab";
import { AdminCardsTab } from "@/components/admin/AdminCardsTab";
import { AdminClaimsTab } from "@/components/admin/AdminClaimsTab";
import { AdminPartnershipsTab } from "@/components/admin/AdminPartnershipsTab";
import { AdminConversationsTab } from "@/components/admin/AdminConversationsTab";
import { AdminLogsTab } from "@/components/admin/AdminLogsTab";
import { AdminStatisticsTab } from "@/components/admin/AdminStatisticsTab";

type TranslationKey = Parameters<ReturnType<typeof useLanguage>["t"]>[0];

function translateExisting(t: unknown, key: string, fallback: string) {
  const value = (t as Record<string, string | undefined>)[key];
  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback;
}

type AdminPanelModalProps = {
  open: boolean;
  onClose: () => void;
};

type Tab =
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

type GrantRarity = "common" | "rare" | "epic" | "legendary" | "random";

type AdminPackType =
  | "common_pack"
  | "rare_pack"
  | "epic_pack"
  | "legendary_pack"
  | "random_pack";

type AdminRewardType = "card" | "pack";
type AdminRewardTarget = "user" | "all_users";

const ADMIN_TABS: { id: Tab; labelKey: string; fallback: string }[] = [
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

const GRANT_RARITIES: {
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

const ADMIN_PACK_TYPES: {
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

const PARTNERSHIP_TYPE_OPTIONS = [
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

function rollRandomRarity(): Exclude<GrantRarity, "random"> {
  const roll = Math.random() * 100;

  if (roll < 60) return "common";
  if (roll < 88) return "rare";
  if (roll < 98) return "epic";
  return "legendary";
}

type TranslateFunction = (key: any) => string;

function translate(t: TranslateFunction, key: string, fallback: string) {
  const value = t(key);

  return value && value !== key ? value : fallback;
}

function getDateLocale(language: string) {
  if (language === "en") return "en-US";
  if (language === "es") return "es-ES";

  return "pt-BR";
}

function getSupportStatusLabel(
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

function getSupportTypeLabel(
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

function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getPartnershipTypeLabel(type: string, t: TranslateFunction) {
  const option = PARTNERSHIP_TYPE_OPTIONS.find((item: any) => item.id === type);

  if (!option) return type;

  return translate(t, option.labelKey as TranslationKey, option.fallback);
}

function getGrantRarityLabel(
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

function getAdminPackLabel(
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

type CreatorRequest = {
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

type ProfileUser = {
  id: string;
  email: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_admin: boolean | null;
  is_banned?: boolean | null;
  created_at: string;
};

type CreatorProfile = {
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

type CreatorProfileVisibilityFilter = "all" | "public" | "hidden";
type CreatorProfileVerificationFilter = "all" | "verified" | "not_verified";
type CreatorProfileOwnerFilter = "all" | "claimed" | "unclaimed";
type CreatorProfileSortFilter =
  | "newest"
  | "oldest"
  | "name"
  | "views"
  | "followers"
  | "shares"
  | "trending";

type CreatorDetectorPlatform = "kick" | "twitch";

type DetectedKickCreator = {
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

type CreatorClaim = {
  id: string;
  creator_id: string;
  user_id: string;
  verification_platform: string;
  verification_url: string;
  verification_code: string;
  status: "pending" | "approved" | "rejected" | "verified";
  created_at: string;
};

type Brand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
  created_at?: string;
  updated_at?: string | null;
};

type CreatorPartnership = {
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

type PartnershipApprovalDraft = {
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

type AdminStats = {
  visits: number;
  logins: number;
  conqueredCards: number;
  openedPacks: number;
  creatorFollows: number;
  pendingRequests: number;
  pendingClaims: number;
  totalCreators: number;
};

type AdminLog = {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type SupportConversationStatus =
  | "open"
  | "waiting_admin"
  | "waiting_user"
  | "resolved"
  | "closed";
type SupportConversationType =
  | "bug"
  | "profile_correction"
  | "claim_profile"
  | "card_pack_problem"
  | "suggestion"
  | "other";
type SupportFilter = "active" | "all" | SupportConversationStatus;

type SupportConversation = {
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

type SupportMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: "user" | "admin" | "system";
  message: string;
  created_at: string;
  read_at: string | null;
};

const SUPPORT_STATUS_FILTERS: {
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

const ACTIVE_SUPPORT_STATUSES: SupportConversationStatus[] = [
  "open",
  "waiting_admin",
  "waiting_user",
];
const FINAL_SUPPORT_STATUSES: SupportConversationStatus[] = [
  "resolved",
  "closed",
];
const CREATOR_IMAGE_BUCKET = "creator-profiles";

function isSupportConversationFinal(status: SupportConversationStatus) {
  return FINAL_SUPPORT_STATUSES.includes(status);
}

export function AdminPanelModal({ open, onClose }: AdminPanelModalProps) {
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
        (first: any, second: any) =>
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
      (creator: any) =>
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
        (groups: any, creator: any) => {
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
      (creator: any) => creator.id === selectedCardCreatorId,
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
    public: creators.filter((creator: any) => creator.is_public).length,
    hidden: creators.filter((creator: any) => !creator.is_public).length,
    verified: creators.filter((creator: any) => creator.is_verified).length,
    notVerified: creators.filter((creator: any) => !creator.is_verified).length,
    claimed: creators.filter((creator: any) => Boolean(creator.user_id)).length,
    unclaimed: creators.filter((creator: any) => !creator.user_id).length,
  };

  const hasCreatorProfileFilters =
    creatorSearch.trim().length > 0 ||
    creatorVisibilityFilter !== "all" ||
    creatorVerificationFilter !== "all" ||
    creatorOwnerFilter !== "all" ||
    creatorSortFilter !== "newest";

  const filteredDetectedKickCreators = detectedKickCreators.filter(
    (creator: any) => {
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
    (creator: any) =>
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

  const filteredCardCreators = creators.filter((creator: any) => {
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
    (total: any, status: any) => total + conversationStatusCounts[status],
    0,
  );

  conversationStatusCounts.active = activeSupportConversationCount;

  const filteredSupportConversations = supportConversations.filter(
    (conversation: any) => {
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
      (conversation: any) => conversation.id === selectedConversationId,
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
      (conversation: any) => conversation.id === selectedConversationId,
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
  const adminPanelCtx = {
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
    getAdminRewardTargets,
    getCreator,
    getCreatorDetectorPlatformLabel,
    getCurrentUserId,
    getDetectedKickKey,
    getFriendlyLogTitle,
    getNameSimilarity,
    getOwner,
    getPossibleCreatorMatches,
    getProfileDisplayName,
    getSafeQuantity,
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
    normalizeDetectorCompare,
    onClose,
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
    updatePartnershipApprovalDraft,
    updateSupportConversationStatus,
    userCardsCount,
    userSearch,
    users,
    usersById,
  };

  return (
    <AnimatePresence>
      {open && (
        <CardpocModalShell
          onClose={onClose}
          showCloseButton
          closeLabel={translate(t, "adminClosePanel", "Fechar painel admin")}
          zIndexClassName="z-[95]"
          className="max-w-7xl"
          contentClassName="no-scrollbar max-h-[calc(100vh-1.5rem)] overflow-y-auto p-6 md:p-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-yellow-100">
            <ShieldCheck size={14} />
            {translate(t, "adminPanelBadge", "Admin Panel")}
          </div>

          <h2 className="mt-6 text-3xl font-black">
            {translate(t, "adminPanelTitle", "Painel Admin")}
          </h2>

          <p className="mt-2 text-sm text-white/50">
            {translate(
              t,
              "adminPanelDescription",
              "Gerencie solicitações, usuários, creators, reivindicações e atividades.",
            )}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {ADMIN_TABS.map((tab: any) => {
              const counter = getTabCounter(tab.id);

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex min-h-[56px] min-w-0 items-center justify-between gap-2 rounded-2xl border px-4 py-2 text-left transition ${
                    activeTab === tab.id
                      ? "border-cyan-300 bg-cyan-300 text-black shadow-[0_0_28px_rgba(103,232,249,0.18)]"
                      : "border-white/10 bg-white/[0.035] text-white/62 hover:border-white/18 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  <span className="line-clamp-2 text-[12px] font-black leading-tight">
                    {translateExisting(t, tab.labelKey, tab.fallback)}
                  </span>

                  {counter !== null && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-black leading-none ${
                        activeTab === tab.id
                          ? "bg-black/15 text-black"
                          : "bg-white/10 text-white/70 group-hover:bg-white/15"
                      }`}
                    >
                      {counter}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {loading && (
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-white/60">
              {translate(t, "adminPanelLoading", "Carregando painel...")}
            </div>
          )}

          {!loading && activeTab === "requests" && <AdminRequestsTab ctx={adminPanelCtx} />}

          {!loading && activeTab === "users" && <AdminUsersTab ctx={adminPanelCtx} />}

          {!loading && activeTab === "creators" && <AdminCreatorsTab ctx={adminPanelCtx} />}

          {!loading && activeTab === "creatorDetector" && <AdminCreatorDetectorTab ctx={adminPanelCtx} />}

          {!loading && activeTab === "cards" && <AdminCardsTab ctx={adminPanelCtx} />}

          {!loading && activeTab === "claims" && <AdminClaimsTab ctx={adminPanelCtx} />}

          {!loading && activeTab === "partnerships" && <AdminPartnershipsTab ctx={adminPanelCtx} />}

          {!loading && activeTab === "conversations" && <AdminConversationsTab ctx={adminPanelCtx} />}

          {!loading && activeTab === "logs" && <AdminLogsTab ctx={adminPanelCtx} />}

          {!loading && activeTab === "statistics" && <AdminStatisticsTab ctx={adminPanelCtx} />}

          <AnimatePresence>
            {partnershipApprovalDraft && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 p-4 backdrop-blur-xl"
              >
                <motion.div
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 18, scale: 0.96 }}
                  className="no-scrollbar max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-cyan-300/20 bg-[#05070d] p-6 shadow-2xl shadow-cyan-500/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-cyan-100">
                        <ShieldCheck size={14} />
                        {translate(
                          t,
                          "adminSmartApprovalBadge",
                          "Aprovação Inteligente",
                        )}
                      </div>

                      <h3 className="mt-4 text-2xl font-black text-white">
                        {translate(
                          t,
                          "adminApprovePartnershipTitle",
                          "Aprovar parceria",
                        )}
                      </h3>

                      <p className="mt-2 max-w-2xl text-sm text-white/50">
                        {translate(
                          t,
                          "adminApprovePartnershipDescription",
                          "Revise a marca uma vez e o Cardpoc reaproveita logo, site e descrição em futuras parcerias com a mesma empresa.",
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPartnershipApprovalDraft(null);
                        setBrandEnrichmentConfidence(null);
                        setBrandEnrichmentSource(null);
                      }}
                      className="rounded-full border border-white/10 bg-white/[0.04] p-3 text-white/60 transition hover:bg-white/[0.08] hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-[220px_1fr]">
                    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-cyan-300/15 bg-cyan-300/10">
                        {partnershipApprovalDraft.brandLogoUrl ? (
                          <img
                            loading="lazy"
                            decoding="async"
                            src={partnershipApprovalDraft.brandLogoUrl}
                            alt={partnershipApprovalDraft.brandName}
                            className="h-full w-full object-contain p-4"
                          />
                        ) : (
                          <Handshake className="text-cyan-100/70" size={54} />
                        )}
                      </div>

                      <p className="mt-4 text-xs text-white/40">
                        {translate(
                          t,
                          "adminBrandPreviewHint",
                          "Prévia da logo da marca. Você pode deixar vazio e completar depois.",
                        )}
                      </p>

                      <button
                        type="button"
                        onClick={enrichBrand}
                        disabled={brandEnrichmentLoading}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Search size={16} />
                        {brandEnrichmentLoading
                          ? translate(
                              t,
                              "adminBrandSearching",
                              "Pesquisando marca...",
                            )
                          : translate(t, "adminBrandSearch", "Pesquisar marca")}
                      </button>

                      {brandEnrichmentConfidence !== null && (
                        <p className="mt-3 rounded-2xl border border-emerald-300/15 bg-emerald-300/10 px-3 py-2 text-xs font-bold text-emerald-100">
                          {translate(
                            t,
                            "adminBrandConfidence",
                            "Confiança da busca",
                          )}
                          : {brandEnrichmentConfidence}%
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                          {translate(
                            t,
                            "adminPartnershipBrandName",
                            "Nome da marca",
                          )}
                        </span>
                        <input
                          value={partnershipApprovalDraft.brandName}
                          onChange={(event) =>
                            updatePartnershipApprovalDraft(
                              "brandName",
                              event.target.value,
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300/40"
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                          {translate(t, "adminPartnershipType", "Tipo")}
                        </span>
                        <select
                          value={partnershipApprovalDraft.partnershipType}
                          onChange={(event) =>
                            updatePartnershipApprovalDraft(
                              "partnershipType",
                              event.target.value,
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300/40"
                        >
                          {PARTNERSHIP_TYPE_OPTIONS.map((option: any) => (
                            <option key={option.id} value={option.id}>
                              {translate(
                                t,
                                option.labelKey as TranslationKey,
                                option.fallback,
                              )}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                          {translate(t, "adminBrandLogoUrl", "Logo da marca")}
                        </span>
                        <input
                          value={partnershipApprovalDraft.brandLogoUrl}
                          onChange={(event) =>
                            updatePartnershipApprovalDraft(
                              "brandLogoUrl",
                              event.target.value,
                            )
                          }
                          placeholder="https://..."
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                          {translate(
                            t,
                            "adminBrandWebsiteUrl",
                            "Site da marca",
                          )}
                        </span>
                        <input
                          value={partnershipApprovalDraft.brandWebsiteUrl}
                          onChange={(event) => {
                            updatePartnershipApprovalDraft(
                              "brandWebsiteUrl",
                              event.target.value,
                            );
                            updatePartnershipApprovalDraft(
                              "websiteUrl",
                              event.target.value,
                            );
                          }}
                          placeholder="https://..."
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                          {translate(
                            t,
                            "adminCampaignName",
                            "Nome da campanha",
                          )}
                        </span>
                        <input
                          value={partnershipApprovalDraft.campaignName}
                          onChange={(event) =>
                            updatePartnershipApprovalDraft(
                              "campaignName",
                              event.target.value,
                            )
                          }
                          placeholder={translate(
                            t,
                            "adminCampaignNamePlaceholder",
                            "Ex: Black Friday 2026",
                          )}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                          {translate(
                            t,
                            "adminPartnershipPublicUrl",
                            "Link público",
                          )}
                        </span>
                        <input
                          value={partnershipApprovalDraft.websiteUrl}
                          onChange={(event) =>
                            updatePartnershipApprovalDraft(
                              "websiteUrl",
                              event.target.value,
                            )
                          }
                          placeholder="https://..."
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                          {translate(t, "adminPartnershipStartDate", "Início")}
                        </span>
                        <input
                          type="date"
                          value={partnershipApprovalDraft.startDate}
                          onChange={(event) =>
                            updatePartnershipApprovalDraft(
                              "startDate",
                              event.target.value,
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                          {translate(t, "adminPartnershipEndDate", "Fim")}
                        </span>
                        <input
                          type="date"
                          value={partnershipApprovalDraft.endDate}
                          onChange={(event) =>
                            updatePartnershipApprovalDraft(
                              "endDate",
                              event.target.value,
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
                        />
                      </label>

                      <label className="block md:col-span-2">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                          {translate(
                            t,
                            "adminBrandDescription",
                            "Descrição da marca",
                          )}
                        </span>
                        <textarea
                          value={partnershipApprovalDraft.brandDescription}
                          onChange={(event) =>
                            updatePartnershipApprovalDraft(
                              "brandDescription",
                              event.target.value,
                            )
                          }
                          rows={3}
                          className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
                        />
                      </label>

                      <label className="block md:col-span-2">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                          {translate(
                            t,
                            "adminPartnershipPublicDescription",
                            "Descrição pública da parceria",
                          )}
                        </span>
                        <textarea
                          value={partnershipApprovalDraft.publicDescription}
                          onChange={(event) =>
                            updatePartnershipApprovalDraft(
                              "publicDescription",
                              event.target.value,
                            )
                          }
                          rows={4}
                          className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[28px] border border-cyan-300/15 bg-cyan-300/[0.04] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/70">
                          {translate(
                            t,
                            "adminPartnershipEvidenceTitle",
                            "Evidência do YouTube",
                          )}
                        </p>
                        <p className="mt-1 text-sm text-white/45">
                          {translate(
                            t,
                            "adminPartnershipEvidenceHint",
                            "Revise a origem da detecção antes de publicar a parceria.",
                          )}
                        </p>
                      </div>

                      {partnershipApprovalDraft.partnership.source_url && (
                        <a
                          href={partnershipApprovalDraft.partnership.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/70 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-100"
                        >
                          <ExternalLink size={14} />
                          {translate(
                            t,
                            "adminPartnershipOpenVideo",
                            "Abrir vídeo",
                          )}
                        </a>
                      )}
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
                      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40">
                        {partnershipApprovalDraft.partnership
                          .source_thumbnail ? (
                          <img
                            loading="lazy"
                            decoding="async"
                            src={
                              partnershipApprovalDraft.partnership
                                .source_thumbnail
                            }
                            alt={
                              partnershipApprovalDraft.partnership
                                .source_title ||
                              translate(
                                t,
                                "adminPartnershipVideoThumbnail",
                                "Thumbnail do vídeo",
                              )
                            }
                            className="aspect-video w-full object-cover"
                          />
                        ) : (
                          <div className="flex aspect-video items-center justify-center bg-white/[0.04] text-white/30">
                            <ExternalLink size={34} />
                          </div>
                        )}
                      </div>

                      <div className="grid gap-3">
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                            {translate(t, "adminPartnershipVideo", "Vídeo")}
                          </p>
                          <p className="mt-2 text-sm font-bold leading-5 text-white">
                            {partnershipApprovalDraft.partnership
                              .source_title ||
                              translate(
                                t,
                                "adminPartnershipVideoUnavailable",
                                "Título do vídeo indisponível",
                              )}
                          </p>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                              {translate(t, "adminPartnershipChannel", "Canal")}
                            </p>
                            <p className="mt-2 truncate text-sm font-bold text-white">
                              {partnershipApprovalDraft.partnership
                                .source_channel ||
                                translate(
                                  t,
                                  "adminPartnershipUnknownChannel",
                                  "Canal não informado",
                                )}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                              {translate(
                                t,
                                "adminPartnershipPublishedAt",
                                "Publicado em",
                              )}
                            </p>
                            <p className="mt-2 text-sm font-bold text-white">
                              {partnershipApprovalDraft.partnership
                                .source_published_at
                                ? new Date(
                                    partnershipApprovalDraft.partnership
                                      .source_published_at,
                                  ).toLocaleDateString(dateLocale)
                                : translate(
                                    t,
                                    "adminPartnershipUnknownDate",
                                    "Data não informada",
                                  )}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/10 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/60">
                            {translate(
                              t,
                              "adminDetectionReason",
                              "Motivo da detecção",
                            )}
                          </p>
                          <p className="mt-2 text-sm font-bold text-emerald-50">
                            {partnershipApprovalDraft.partnership
                              .detection_reason === "paid_product_placement"
                              ? translate(
                                  t,
                                  "adminPartnershipPaidPromotion",
                                  "Promoção paga detectada pelo YouTube",
                                )
                              : partnershipApprovalDraft.partnership
                                    .detection_reason === "keyword_match"
                                ? translate(
                                    t,
                                    "adminPartnershipKeywordMatch",
                                    "Termos de parceria encontrados no título ou descrição",
                                  )
                                : partnershipApprovalDraft.partnership
                                    .detection_reason ||
                                  translate(
                                    t,
                                    "adminPartnershipUnknownReason",
                                    "Motivo não informado",
                                  )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[24px] border border-white/10 bg-black/30 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                        {translate(
                          t,
                          "adminEvidenceText",
                          "Evidência encontrada",
                        )}
                      </p>
                      <p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap text-sm text-white/55">
                        {partnershipApprovalDraft.partnership.evidence_text ||
                          translate(
                            t,
                            "adminNoEvidenceText",
                            "Sem texto de evidência.",
                          )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPartnershipApprovalDraft(null);
                        setBrandEnrichmentConfidence(null);
                        setBrandEnrichmentSource(null);
                      }}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/70 transition hover:bg-white/[0.08]"
                    >
                      {translate(t, "cancel", "Cancelar")}
                    </button>

                    <button
                      type="button"
                      onClick={approvePartnership}
                      disabled={
                        actionLoading ===
                        partnershipApprovalDraft.partnership.id
                      }
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-black text-black transition hover:scale-105 disabled:opacity-40"
                    >
                      <Check size={16} />
                      {actionLoading === partnershipApprovalDraft.partnership.id
                        ? translate(t, "approving", "Aprovando...")
                        : translate(
                            t,
                            "adminApproveAndPublish",
                            "Aprovar e publicar",
                          )}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {imageEditorCreator && (
              <motion.div
                className="fixed inset-0 z-[115] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 18 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 18 }}
                  className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/10 bg-zinc-950/95 shadow-2xl shadow-cyan-500/10"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-100/60">
                        {translate(t, "adminCreatorImage", "Imagem do criador")}
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-white">
                        {translate(
                          t,
                          "adminChangeCreatorImage",
                          "Alterar imagem",
                        )}
                      </h3>
                      <p className="mt-1 text-sm text-white/45">
                        {imageEditorCreator.nickname} @
                        {imageEditorCreator.username}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={closeCreatorImageEditor}
                      className="rounded-full border border-white/10 bg-white/[0.04] p-3 text-white/60 transition hover:bg-white/[0.08] hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="grid gap-5 p-6 md:grid-cols-[180px_1fr]">
                    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/40">
                      {imageEditorObjectUrl ? (
                        <img
                          loading="lazy"
                          decoding="async"
                          src={imageEditorObjectUrl}
                          alt={translate(
                            t,
                            "adminCreatorImagePreview",
                            "Prévia da imagem",
                          )}
                          className="aspect-[3/4] w-full object-cover"
                        />
                      ) : imageEditorUrl.trim() ? (
                        <img
                          loading="lazy"
                          decoding="async"
                          src={imageEditorUrl.trim()}
                          alt={translate(
                            t,
                            "adminCreatorImagePreview",
                            "Prévia da imagem",
                          )}
                          className="aspect-[3/4] w-full object-cover"
                        />
                      ) : imageEditorCreator.avatar_url ? (
                        <img
                          loading="lazy"
                          decoding="async"
                          src={imageEditorCreator.avatar_url}
                          alt={translate(
                            t,
                            "adminCreatorImagePreview",
                            "Prévia da imagem",
                          )}
                          className="aspect-[3/4] w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-[3/4] w-full items-center justify-center text-white/30">
                          <ImageIcon size={36} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <label className="block">
                        <span className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-white/70">
                          <Link size={16} />
                          {translate(
                            t,
                            "adminCreatorImageUrl",
                            "URL da imagem",
                          )}
                        </span>
                        <input
                          value={imageEditorUrl}
                          onChange={(event) => {
                            setImageEditorUrl(event.target.value);
                            if (event.target.value.trim())
                              setImageEditorFile(null);
                          }}
                          placeholder="https://..."
                          className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/40"
                        />
                      </label>

                      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                        <p className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-white/70">
                          <Upload size={16} />
                          {translate(
                            t,
                            "adminCreatorImageUpload",
                            "Upload de arquivo",
                          )}
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0] || null;
                            setImageEditorFile(file);
                            if (file) setImageEditorUrl("");
                          }}
                          className="block w-full cursor-pointer rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-cyan-300 file:px-4 file:py-2 file:text-sm file:font-black file:text-black hover:file:bg-cyan-200"
                        />
                        <p className="mt-3 text-xs text-white/35">
                          {translate(
                            t,
                            "adminCreatorImageUploadHint",
                            "Use uma imagem vertical para preservar o visual premium da carta.",
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 p-6">
                    <button
                      type="button"
                      onClick={closeCreatorImageEditor}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/70 transition hover:bg-white/[0.08]"
                    >
                      {translate(t, "cancel", "Cancelar")}
                    </button>

                    <button
                      type="button"
                      onClick={saveCreatorImage}
                      disabled={
                        actionLoading ===
                        `creator-image-${imageEditorCreator.id}`
                      }
                      className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-black transition hover:scale-105 disabled:opacity-40"
                    >
                      <Check size={16} />
                      {actionLoading ===
                      `creator-image-${imageEditorCreator.id}`
                        ? translate(t, "saving", "Salvando...")
                        : translate(t, "save", "Salvar")}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {successToast && (
              <motion.button
                type="button"
                onClick={() => setSuccessToast(null)}
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                className="fixed bottom-6 left-1/2 z-[120] max-w-md -translate-x-1/2 rounded-3xl border border-emerald-300/20 bg-emerald-950/95 px-5 py-4 text-left text-sm font-bold text-emerald-50 shadow-2xl shadow-emerald-500/20 backdrop-blur-2xl"
              >
                {successToast}
              </motion.button>
            )}
          </AnimatePresence>
        </CardpocModalShell>
      )}
    </AnimatePresence>
  );
}
