"use client";

import { Search, UserCog } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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

export const RARITY_LEVEL: Record<Exclude<GrantRarity, "random">, number> = {
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
  const option = PARTNERSHIP_TYPE_OPTIONS.find((item) => item.id === type);

  if (!option) return type;

  return translate(t, option.labelKey as TranslationKey, option.fallback);
}

export function getGrantRarityLabel(
  rarity: GrantRarity | string,
  t: TranslateFunction,
) {
  const rarityOption = GRANT_RARITIES.find((item) => item.id === rarity);

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
  const packOption = ADMIN_PACK_TYPES.find((item) => item.id === packType);

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
export const CREATOR_IMAGE_BUCKET = "creator-profiles";

export function isSupportConversationFinal(status: SupportConversationStatus) {
  return FINAL_SUPPORT_STATUSES.includes(status);
}


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
