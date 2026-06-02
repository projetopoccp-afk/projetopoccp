"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  EyeOff,
  Gift,
  History,
  Search,
  ShieldCheck,
  UserCog,
  X,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase/client";

type AdminPanelModalProps = {
  open: boolean;
  onClose: () => void;
};

type Tab = "requests" | "users" | "creators" | "cards" | "claims" | "logs";

type GrantRarity = "common" | "rare" | "epic" | "legendary" | "random";

const ADMIN_TABS: { id: Tab; labelKey: string; fallback: string }[] = [
  { id: "requests", labelKey: "adminRequests", fallback: "Solicitações" },
  { id: "users", labelKey: "adminUsers", fallback: "Usuários" },
  { id: "creators", labelKey: "adminProfiles", fallback: "Perfis" },
  { id: "cards", labelKey: "adminManageCards", fallback: "Gerenciar Cartas" },
  { id: "claims", labelKey: "adminClaims", fallback: "Reivindicações" },
  { id: "logs", labelKey: "adminActivities", fallback: "Atividades" },
];

const GRANT_RARITIES: {
  id: GrantRarity;
  labelKey: string;
  fallback: string;
  descriptionKey: string;
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

function getGrantRarityLabel(
  rarity: GrantRarity | string,
  t: TranslateFunction,
) {
  const rarityOption = GRANT_RARITIES.find((item) => item.id === rarity);

  if (!rarityOption) return rarity;

  return translate(t, rarityOption.labelKey, rarityOption.fallback);
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

type AdminLog = {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

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
  const [logs, setLogs] = useState<AdminLog[]>([]);

  const [userSearch, setUserSearch] = useState("");
  const [creatorSearch, setCreatorSearch] = useState("");
  const [claimSearch, setClaimSearch] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [cardCreatorSearch, setCardCreatorSearch] = useState("");
  const [cardUserSearch, setCardUserSearch] = useState("");
  const [selectedCardCreatorId, setSelectedCardCreatorId] = useState("");
  const [selectedCardUserId, setSelectedCardUserId] = useState("");
  const [selectedGrantRarity, setSelectedGrantRarity] =
    useState<GrantRarity>("common");

  const [selectedOwners, setSelectedOwners] = useState<Record<string, string>>(
    {},
  );
  const [expandedCreators, setExpandedCreators] = useState<
    Record<string, boolean>
  >({});
  const [expandedClaims, setExpandedClaims] = useState<Record<string, boolean>>(
    {},
  );
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

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
    targetId: string;
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
        "id, email, display_name, username, avatar_url, is_admin, created_at",
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

  async function loadLogs() {
    const { data } = await supabase
      .from("admin_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80);

    setLogs((data || []) as AdminLog[]);
  }

  async function loadPanel() {
    setLoading(true);

    await Promise.all([
      loadRequests(),
      loadUsers(),
      loadCreators(),
      loadClaims(),
      loadLogs(),
    ]);

    setLoading(false);
  }

  useEffect(() => {
    if (open) {
      loadPanel();
    }
  }, [open]);

  function getOwner(userId: string | null) {
    if (!userId) return null;
    return users.find((user) => user.id === userId) || null;
  }

  function getCreator(creatorId: string | null) {
    if (!creatorId) return null;
    return creators.find((creator) => creator.id === creatorId) || null;
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
        title: "Rising Creator",
        faction: "Nexus Origin",
        category: request.category || "Creator",
        status: "offline",
        avatar_url: request.card_image_url,
        banner_url: request.card_image_url,
        bio: "Novo creator aprovado na plataforma.",
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

  async function removeCreatorOwner(creator: CreatorProfile) {
    setActionLoading(creator.id);

    const { error } = await supabase
      .from("creator_profiles")
      .update({
        user_id: null,
        owner_status: "unclaimed",
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

    const newOwner = users.find((user) => user.id === userId);

    const { error } = await supabase
      .from("creator_profiles")
      .update({
        user_id: userId || null,
        owner_status: userId ? "claimed" : "unclaimed",
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

  async function grantCardToUser() {
    if (!selectedCardCreatorId) {
      alert(
        translate(
          t,
          "adminSelectCreatorCardFirst",
          "Selecione um creator/carta primeiro.",
        ),
      );
      return;
    }

    if (!selectedCardUserId) {
      alert(
        translate(
          t,
          "adminSelectCardRecipient",
          "Selecione o usuário que vai receber a carta.",
        ),
      );
      return;
    }

    const selectedCreator = creators.find(
      (creator) => creator.id === selectedCardCreatorId,
    );
    const selectedUser = users.find((user) => user.id === selectedCardUserId);

    if (!selectedCreator || !selectedUser) {
      alert(
        translate(
          t,
          "adminCreatorOrUserNotFound",
          "Creator ou usuário não encontrado.",
        ),
      );
      return;
    }

    const finalRarity =
      selectedGrantRarity === "random"
        ? rollRandomRarity()
        : selectedGrantRarity;

    const actionId = `grant-card-${selectedCardCreatorId}-${selectedCardUserId}`;
    setActionLoading(actionId);

    const { error } = await supabase.rpc("grant_user_card", {
      p_target_user_id: selectedCardUserId,
      p_creator_id: selectedCardCreatorId,
      p_rarity: finalRarity,
      p_source:
        selectedGrantRarity === "random" ? "admin_random_grant" : "admin_grant",
      p_selected_rarity: selectedGrantRarity,
    });

    if (error) {
      setActionLoading(null);
      alert(error.message);
      return;
    }

    setActionLoading(null);
    await loadLogs();

    alert(
      translate(
        t,
        "adminCardSentSuccess",
        "Carta enviada! {creator} ({rarity}) foi entregue para {user}.",
      )
        .replace("{creator}", selectedCreator.nickname)
        .replace("{rarity}", getGrantRarityLabel(finalRarity, t))
        .replace(
          "{user}",
          selectedUser.display_name ||
            selectedUser.username ||
            selectedUser.email ||
            translate(t, "user", "Usuário"),
        ),
    );
  }

  const filteredUsers = users.filter((user) => {
    const search = userSearch.toLowerCase().trim();

    const searchableText = [user.email, user.display_name, user.username]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search);
  });

  const filteredCreators = creators.filter((creator) => {
    const search = creatorSearch.toLowerCase().trim();
    const owner = getOwner(creator.user_id);

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
  });

  const filteredClaims = claims.filter((claim) => {
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

  const filteredCardCreators = creators.filter((creator) => {
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

  const filteredCardUsers = users.filter((user) => {
    const search = cardUserSearch.toLowerCase().trim();

    const searchableText = [user.email, user.display_name, user.username]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search);
  });

  const selectedCardCreator =
    creators.find((creator) => creator.id === selectedCardCreatorId) || null;

  const selectedCardUser =
    users.find((user) => user.id === selectedCardUserId) || null;

  const grantActionId = `grant-card-${selectedCardCreatorId}-${selectedCardUserId}`;

  const filteredLogs = logs.filter((log) => {
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-4"
        >
          <button
            onClick={onClose}
            className="absolute inset-0"
            aria-label={translate(t, "adminClosePanel", "Fechar painel admin")}
          />

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.94 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="no-scrollbar relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-[32px] border border-white/15 bg-zinc-950 p-6 text-white shadow-[0_0_80px_rgba(0,0,0,0.9)] md:p-8"
          >
            <button
              onClick={onClose}
              className="absolute right-5 top-5 z-10 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label={translate(t, "close", "Fechar")}
            >
              <X size={18} />
            </button>

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

            <div className="mt-6 flex flex-wrap gap-2">
              {ADMIN_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? "bg-cyan-300 text-black"
                      : "border border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  {translate(t, tab.labelKey, tab.fallback)}
                </button>
              ))}
            </div>

            {loading && (
              <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-white/60">
                {translate(t, "adminPanelLoading", "Carregando painel...")}
              </div>
            )}

            {!loading && activeTab === "requests" && (
              <div className="mt-8 grid gap-5">
                {requests.length === 0 && (
                  <EmptyBox
                    text={translate(
                      t,
                      "adminNoPendingRequests",
                      "Nenhuma solicitação pendente.",
                    )}
                  />
                )}

                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="grid gap-5 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 md:grid-cols-[180px_1fr]"
                  >
                    <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40">
                      {request.card_image_url ? (
                        <img
                          src={request.card_image_url}
                          alt={request.nickname}
                          className="h-64 w-full object-cover md:h-full"
                        />
                      ) : (
                        <div className="flex h-64 items-center justify-center text-white/30">
                          {translate(t, "noImage", "Sem imagem")}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-2xl font-black">
                        {request.nickname}
                      </h3>

                      <p className="text-white/45">@{request.username}</p>
                      <p className="mt-1 text-sm text-white/40">
                        {request.email}
                      </p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <InfoBox
                          label={translate(t, "platform", "Plataforma")}
                          value={
                            request.verification_platform ||
                            translate(t, "notInformed", "Não informado")
                          }
                        />

                        <InfoBox
                          label={translate(t, "code", "Código")}
                          value={request.verification_code}
                          highlight
                        />
                      </div>

                      {request.verification_url && (
                        <a
                          href={request.verification_url}
                          target="_blank"
                          className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-300/20"
                        >
                          <ExternalLink size={16} />
                          {translate(
                            t,
                            "adminOpenChannelProfile",
                            "Abrir canal/perfil",
                          )}
                        </a>
                      )}

                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          onClick={() => approveRequest(request)}
                          disabled={actionLoading === request.id}
                          className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-black text-black transition hover:scale-105 disabled:opacity-40"
                        >
                          <Check size={16} />
                          {actionLoading === request.id
                            ? translate(t, "approving", "Aprovando...")
                            : translate(t, "approve", "Aprovar")}
                        </button>

                        <button
                          onClick={() => rejectRequest(request)}
                          disabled={actionLoading === request.id}
                          className="inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-300/10 px-5 py-3 text-sm font-bold text-red-100 transition hover:bg-red-300/20 disabled:opacity-40"
                        >
                          <X size={16} />
                          {actionLoading === request.id
                            ? translate(t, "processing", "Processando...")
                            : translate(t, "reject", "Rejeitar")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && activeTab === "users" && (
              <div className="mt-8">
                <SearchInput
                  value={userSearch}
                  onChange={setUserSearch}
                  placeholder={translate(
                    t,
                    "adminSearchUserPlaceholder",
                    "Buscar por nome, username ou email...",
                  )}
                />

                <div className="mt-5 grid gap-4">
                  {filteredUsers.length === 0 && (
                    <EmptyBox
                      text={translate(
                        t,
                        "adminNoUsersFound",
                        "Nenhum usuário encontrado.",
                      )}
                    />
                  )}

                  {filteredUsers.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <UserInfo profile={profile} t={t} />

                      <div className="flex flex-wrap items-center gap-3">
                        {profile.is_admin && (
                          <StatusPill
                            label={translate(t, "admin", "Admin")}
                            tone="yellow"
                          />
                        )}

                        <button
                          onClick={() => toggleAdmin(profile)}
                          disabled={actionLoading === profile.id}
                          className={`rounded-full px-5 py-2 text-sm font-bold transition disabled:opacity-40 ${
                            profile.is_admin
                              ? "border border-red-300/20 bg-red-300/10 text-red-100 hover:bg-red-300/20"
                              : "bg-cyan-300 text-black hover:scale-105"
                          }`}
                        >
                          {profile.is_admin
                            ? translate(t, "adminRemoveAdmin", "Remover Admin")
                            : translate(t, "adminMakeAdmin", "Tornar Admin")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && activeTab === "creators" && (
              <div className="mt-8">
                <SearchInput
                  value={creatorSearch}
                  onChange={setCreatorSearch}
                  placeholder={translate(
                    t,
                    "adminSearchCreatorPlaceholder",
                    "Buscar por creator, dono, email ou username...",
                  )}
                />

                <div className="mt-5 grid gap-4">
                  {filteredCreators.length === 0 && (
                    <EmptyBox
                      text={translate(
                        t,
                        "adminNoCreatorsFound",
                        "Nenhum creator encontrado.",
                      )}
                    />
                  )}

                  {filteredCreators.map((creator) => {
                    const owner = getOwner(creator.user_id);
                    const selectedOwnerId =
                      selectedOwners[creator.id] ?? creator.user_id ?? "";
                    const isExpanded = expandedCreators[creator.id] ?? false;

                    return (
                      <div
                        key={creator.id}
                        className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] backdrop-blur-xl"
                      >
                        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                              {creator.avatar_url ? (
                                <img
                                  src={creator.avatar_url}
                                  alt={creator.nickname}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-white/30">
                                  {translate(t, "noImage", "Sem imagem")}
                                </div>
                              )}
                            </div>

                            <div>
                              <h3 className="text-xl font-black text-white">
                                {creator.nickname}
                              </h3>

                              {creator.title && (
                                <p className="mt-1 text-sm font-semibold text-cyan-100">
                                  {creator.title}
                                </p>
                              )}

                              <p className="text-sm text-white/45">
                                @{creator.username}
                              </p>

                              <p className="mt-1 text-xs text-white/35">
                                {translate(t, "owner", "Dono")}:{" "}
                                {owner
                                  ? owner.email ||
                                    owner.display_name ||
                                    translate(t, "noEmail", "Sem email")
                                  : translate(t, "noOwner", "Sem dono")}
                              </p>

                              <div className="mt-2 flex flex-wrap gap-2">
                                <StatusPill
                                  label={`👁 ${Number(
                                    creator.views_count || 0,
                                  ).toLocaleString(dateLocale)}`}
                                  tone="cyan"
                                />

                                <StatusPill
                                  label={`👥 ${Number(
                                    creator.followers_count || 0,
                                  ).toLocaleString(dateLocale)}`}
                                />

                                <StatusPill
                                  label={`🔗 ${Number(
                                    creator.share_count || 0,
                                  ).toLocaleString(dateLocale)}`}
                                  tone="yellow"
                                />

                                <StatusPill
                                  label={`🔥 ${Number(
                                    creator.trending_score || 0,
                                  ).toLocaleString(dateLocale)}`}
                                  tone="yellow"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 md:justify-end">
                            <StatusPill
                              label={
                                creator.user_id
                                  ? `👤 ${translate(t, "claimed", "Reivindicado")}`
                                  : `👤 ${translate(t, "noOwner", "Sem dono")}`
                              }
                            />

                            <StatusPill
                              label={
                                creator.is_verified
                                  ? `✓ ${translate(t, "verified", "Verificado")}`
                                  : `○ ${translate(t, "notVerified", "Não verificado")}`
                              }
                              tone={creator.is_verified ? "yellow" : "default"}
                            />

                            <StatusPill
                              label={
                                creator.is_public
                                  ? `🌐 ${translate(t, "public", "Público")}`
                                  : `🔒 ${translate(t, "hidden", "Oculto")}`
                              }
                              tone={creator.is_public ? "cyan" : "default"}
                            />

                            <button
                              onClick={() =>
                                setExpandedCreators((current) => ({
                                  ...current,
                                  [creator.id]: !isExpanded,
                                }))
                              }
                              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white transition hover:bg-white/[0.08]"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp size={16} />
                                  {translate(t, "collapse", "Recolher")}
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={16} />
                                  {translate(t, "expand", "Expandir")}
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <>
                            <div className="grid gap-4 border-t border-white/10 p-5 md:grid-cols-2">
                              <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
                                <h4 className="font-bold text-white">
                                  {translate(
                                    t,
                                    "adminOwnerManagement",
                                    "Gerenciamento do proprietário",
                                  )}
                                </h4>

                                <p className="mt-2 text-sm text-white/45">
                                  {translate(
                                    t,
                                    "adminOwnerManagementDescription",
                                    "Atribua este perfil a um usuário logado ou remova o dono atual.",
                                  )}
                                </p>

                                <select
                                  value={selectedOwnerId}
                                  onChange={(event) =>
                                    setSelectedOwners((current) => ({
                                      ...current,
                                      [creator.id]: event.target.value,
                                    }))
                                  }
                                  className="mt-4 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none"
                                >
                                  <option value="">
                                    {translate(t, "noOwner", "Sem dono")}
                                  </option>

                                  {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                      {user.email ||
                                        user.display_name ||
                                        user.id}
                                    </option>
                                  ))}
                                </select>

                                <div className="mt-4 flex flex-wrap gap-3">
                                  <button
                                    onClick={() =>
                                      changeCreatorOwner(
                                        creator,
                                        selectedOwnerId,
                                      )
                                    }
                                    disabled={actionLoading === creator.id}
                                    className="rounded-full bg-cyan-300 px-5 py-2 text-sm font-black text-black transition hover:scale-105 disabled:opacity-40"
                                  >
                                    {translate(
                                      t,
                                      "adminAssignOwner",
                                      "Atribuir proprietário",
                                    )}
                                  </button>

                                  <button
                                    onClick={() => removeCreatorOwner(creator)}
                                    disabled={
                                      actionLoading === creator.id ||
                                      !creator.user_id
                                    }
                                    className="rounded-full border border-red-300/20 bg-red-300/10 px-5 py-2 text-sm font-bold text-red-100 transition hover:bg-red-300/20 disabled:opacity-40"
                                  >
                                    {translate(
                                      t,
                                      "adminRemoveOwner",
                                      "Remover dono",
                                    )}
                                  </button>
                                </div>
                              </div>

                              <div className="rounded-3xl border border-purple-300/15 bg-purple-300/[0.04] p-5">
                                <h4 className="font-bold text-white">
                                  {translate(
                                    t,
                                    "adminQuickActions",
                                    "Ações rápidas",
                                  )}
                                </h4>

                                <p className="mt-2 text-sm text-white/45">
                                  {translate(
                                    t,
                                    "adminQuickActionsDescription",
                                    "Controle visibilidade e validação pública do creator.",
                                  )}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-3">
                                  <button
                                    onClick={() =>
                                      toggleCreatorVerified(creator)
                                    }
                                    disabled={actionLoading === creator.id}
                                    className="rounded-full border border-yellow-300/20 bg-yellow-300/10 px-5 py-2 text-sm font-bold text-yellow-100 transition hover:bg-yellow-300/20 disabled:opacity-40"
                                  >
                                    {creator.is_verified
                                      ? translate(
                                          t,
                                          "adminRemoveVerification",
                                          "Remover verificação",
                                        )
                                      : translate(
                                          t,
                                          "adminVerifyProfile",
                                          "Verificar perfil",
                                        )}
                                  </button>

                                  <button
                                    onClick={() => toggleCreatorPublic(creator)}
                                    disabled={actionLoading === creator.id}
                                    className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/20 disabled:opacity-40"
                                  >
                                    {creator.is_public ? (
                                      <>
                                        <EyeOff size={16} />
                                        {translate(
                                          t,
                                          "adminHideProfile",
                                          "Ocultar perfil",
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        <Eye size={16} />
                                        {translate(
                                          t,
                                          "adminPublishProfile",
                                          "Publicar perfil",
                                        )}
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="grid gap-3 border-t border-white/10 bg-black/20 p-5 text-sm text-white/45 sm:grid-cols-3 lg:grid-cols-6">
                              <SmallInfo
                                label={translate(t, "id", "ID")}
                                value={creator.id}
                              />
                              <SmallInfo
                                label={translate(t, "createdAt", "Criado em")}
                                value={new Date(
                                  creator.created_at,
                                ).toLocaleDateString(dateLocale)}
                              />
                              <SmallInfo
                                label={translate(t, "category", "Categoria")}
                                value={
                                  creator.category ||
                                  translate(t, "creator", "Creator")
                                }
                              />
                              <SmallInfo
                                label={translate(t, "views", "Views")}
                                value={Number(
                                  creator.views_count || 0,
                                ).toLocaleString(dateLocale)}
                              />
                              <SmallInfo
                                label={translate(t, "followers", "Seguidores")}
                                value={Number(
                                  creator.followers_count || 0,
                                ).toLocaleString(dateLocale)}
                              />
                              <SmallInfo
                                label={translate(
                                  t,
                                  "shares",
                                  "Compartilhamentos",
                                )}
                                value={Number(
                                  creator.share_count || 0,
                                ).toLocaleString(dateLocale)}
                              />
                              <SmallInfo
                                label="Trending"
                                value={Number(
                                  creator.trending_score || 0,
                                ).toLocaleString(dateLocale)}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!loading && activeTab === "cards" && (
              <div className="mt-8 space-y-6">
                <div className="rounded-[28px] border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                      <Gift size={20} />
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-white">
                        {translate(t, "adminManageCards", "Gerenciar Cartas")}
                      </h3>
                      <p className="mt-1 text-sm text-white/50">
                        {translate(
                          t,
                          "adminManageCardsDescription",
                          "Escolha uma carta de creator, selecione o usuário e envie uma raridade específica ou aleatória.",
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
                  <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                    <h4 className="font-black text-white">
                      {translate(t, "adminChooseCardStep", "1. Escolher carta")}
                    </h4>
                    <p className="mt-1 text-sm text-white/45">
                      {translate(
                        t,
                        "adminChooseCardDescription",
                        "Pesquise pelo nome do creator, username, categoria ou dono.",
                      )}
                    </p>

                    <div className="mt-4">
                      <SearchInput
                        value={cardCreatorSearch}
                        onChange={setCardCreatorSearch}
                        placeholder={translate(
                          t,
                          "adminSearchCardPlaceholder",
                          "Buscar creator/carta...",
                        )}
                      />
                    </div>

                    <div className="mt-4 grid max-h-[420px] gap-3 overflow-y-auto pr-1">
                      {filteredCardCreators.length === 0 && (
                        <EmptyBox
                          text={translate(
                            t,
                            "adminNoCardsFound",
                            "Nenhuma carta encontrada.",
                          )}
                        />
                      )}

                      {filteredCardCreators.map((creator) => {
                        const selected = selectedCardCreatorId === creator.id;
                        const owner = getOwner(creator.user_id);

                        return (
                          <button
                            key={creator.id}
                            type="button"
                            onClick={() => setSelectedCardCreatorId(creator.id)}
                            className={`flex items-center gap-4 rounded-3xl border p-4 text-left transition ${
                              selected
                                ? "border-cyan-300/60 bg-cyan-300/10"
                                : "border-white/10 bg-black/20 hover:bg-white/[0.05]"
                            }`}
                          >
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                              {creator.avatar_url ? (
                                <img
                                  src={creator.avatar_url}
                                  alt={creator.nickname}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-white/30">
                                  {translate(t, "noImage", "Sem imagem")}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h5 className="truncate font-black text-white">
                                {creator.nickname}
                              </h5>
                              <p className="truncate text-sm text-cyan-100/70">
                                @{creator.username}
                              </p>
                              <p className="mt-1 truncate text-xs text-white/40">
                                {translate(t, "owner", "Dono")}:{" "}
                                {owner?.email ||
                                  owner?.username ||
                                  translate(t, "noOwner", "Sem dono")}
                              </p>
                            </div>

                            {selected && (
                              <Check
                                size={18}
                                className="shrink-0 text-cyan-200"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                      <h4 className="font-black text-white">
                        {translate(
                          t,
                          "adminChooseUserStep",
                          "2. Escolher usuário",
                        )}
                      </h4>
                      <p className="mt-1 text-sm text-white/45">
                        {translate(
                          t,
                          "adminChooseUserDescription",
                          "Pesquise por nome, username ou email.",
                        )}
                      </p>

                      <div className="mt-4">
                        <SearchInput
                          value={cardUserSearch}
                          onChange={setCardUserSearch}
                          placeholder={translate(
                            t,
                            "adminSearchUserShortPlaceholder",
                            "Buscar usuário...",
                          )}
                        />
                      </div>

                      <div className="mt-4 grid max-h-[260px] gap-3 overflow-y-auto pr-1">
                        {filteredCardUsers.length === 0 && (
                          <EmptyBox
                            text={translate(
                              t,
                              "adminNoUsersFound",
                              "Nenhum usuário encontrado.",
                            )}
                          />
                        )}

                        {filteredCardUsers.map((profile) => {
                          const selected = selectedCardUserId === profile.id;

                          return (
                            <button
                              key={profile.id}
                              type="button"
                              onClick={() => setSelectedCardUserId(profile.id)}
                              className={`flex items-center justify-between gap-3 rounded-3xl border p-3 text-left transition ${
                                selected
                                  ? "border-purple-300/60 bg-purple-300/10"
                                  : "border-white/10 bg-black/20 hover:bg-white/[0.05]"
                              }`}
                            >
                              <UserInfo profile={profile} t={t} />
                              {selected && (
                                <Check
                                  size={18}
                                  className="shrink-0 text-purple-200"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                      <h4 className="font-black text-white">
                        {translate(
                          t,
                          "adminChooseRarityStep",
                          "3. Escolher raridade",
                        )}
                      </h4>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {GRANT_RARITIES.map((rarityOption) => {
                          const selected =
                            selectedGrantRarity === rarityOption.id;

                          return (
                            <button
                              key={rarityOption.id}
                              type="button"
                              onClick={() =>
                                setSelectedGrantRarity(rarityOption.id)
                              }
                              className={`rounded-2xl border p-3 text-left transition ${
                                selected
                                  ? "border-yellow-300/60 bg-yellow-300/10"
                                  : "border-white/10 bg-black/20 hover:bg-white/[0.05]"
                              }`}
                            >
                              <p className="font-bold text-white">
                                {translate(
                                  t,
                                  rarityOption.labelKey,
                                  rarityOption.fallback,
                                )}
                              </p>
                              <p className="mt-1 text-xs text-white/40">
                                {translate(
                                  t,
                                  rarityOption.descriptionKey,
                                  rarityOption.descriptionFallback,
                                )}
                              </p>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-5 rounded-3xl border border-white/10 bg-black/25 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                          {translate(t, "summary", "Resumo")}
                        </p>

                        <div className="mt-3 space-y-2 text-sm text-white/65">
                          <p>
                            {translate(t, "card", "Carta")}:{" "}
                            <span className="font-bold text-white">
                              {selectedCardCreator?.nickname ||
                                translate(
                                  t,
                                  "noneSelectedFeminine",
                                  "Nenhuma selecionada",
                                )}
                            </span>
                          </p>
                          <p>
                            {translate(t, "user", "Usuário")}:{" "}
                            <span className="font-bold text-white">
                              {selectedCardUser?.display_name ||
                                selectedCardUser?.username ||
                                selectedCardUser?.email ||
                                translate(
                                  t,
                                  "noneSelectedMasculine",
                                  "Nenhum selecionado",
                                )}
                            </span>
                          </p>
                          <p>
                            {translate(t, "rarity", "Raridade")}:{" "}
                            <span className="font-bold text-white">
                              {getGrantRarityLabel(selectedGrantRarity, t)}
                            </span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={grantCardToUser}
                        disabled={
                          !selectedCardCreatorId ||
                          !selectedCardUserId ||
                          actionLoading === grantActionId
                        }
                        className="mt-5 w-full rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {actionLoading === grantActionId
                          ? translate(
                              t,
                              "adminSendingCard",
                              "Enviando carta...",
                            )
                          : translate(
                              t,
                              "adminSendCardToUser",
                              "Enviar carta para usuário",
                            )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!loading && activeTab === "claims" && (
              <div className="mt-8">
                <SearchInput
                  value={claimSearch}
                  onChange={setClaimSearch}
                  placeholder={translate(
                    t,
                    "adminSearchClaimPlaceholder",
                    "Buscar reivindicações por criador, usuário, email ou código...",
                  )}
                />

                <div className="mt-5 grid gap-4">
                  {filteredClaims.length === 0 && (
                    <EmptyBox
                      text={translate(
                        t,
                        "adminNoPendingClaims",
                        "Nenhuma reivindicação pendente.",
                      )}
                    />
                  )}

                  {filteredClaims.map((claim) => {
                    const creator = getCreator(claim.creator_id);
                    const claimant = getOwner(claim.user_id);
                    const isExpanded = expandedClaims[claim.id] ?? false;

                    return (
                      <div
                        key={claim.id}
                        className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] backdrop-blur-xl"
                      >
                        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                              {creator?.avatar_url ? (
                                <img
                                  src={creator.avatar_url}
                                  alt={creator.nickname}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-white/30">
                                  {translate(t, "noImage", "Sem imagem")}
                                </div>
                              )}
                            </div>

                            <div>
                              <h3 className="text-xl font-black text-white">
                                {creator?.nickname ||
                                  translate(
                                    t,
                                    "creatorNotFound",
                                    "Creator não encontrado",
                                  )}
                              </h3>

                              <p className="text-sm text-white/45">
                                @
                                {creator?.username ||
                                  translate(t, "noUsername", "sem_username")}
                              </p>

                              <p className="mt-1 text-xs text-white/35">
                                {translate(t, "claimedBy", "Reivindicado por")}:{" "}
                                {claimant
                                  ? claimant.email ||
                                    claimant.display_name ||
                                    translate(t, "noEmailLower", "sem email")
                                  : claim.user_id}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 md:justify-end">
                            <StatusPill
                              label={translate(
                                t,
                                "pendingClaim",
                                "Pending claim",
                              )}
                              tone="yellow"
                            />

                            <StatusPill
                              label={claim.verification_platform}
                              tone="cyan"
                            />

                            <button
                              onClick={() =>
                                setExpandedClaims((current) => ({
                                  ...current,
                                  [claim.id]: !isExpanded,
                                }))
                              }
                              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white transition hover:bg-white/[0.08]"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp size={16} />
                                  {translate(t, "collapse", "Recolher")}
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={16} />
                                  {translate(t, "expand", "Expandir")}
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <>
                            <div className="grid gap-4 border-t border-white/10 p-5 md:grid-cols-2">
                              <InfoBox
                                label={translate(t, "code", "Código")}
                                value={claim.verification_code}
                                highlight
                              />

                              <InfoBox
                                label={translate(
                                  t,
                                  "requestedAt",
                                  "Solicitado em",
                                )}
                                value={new Date(
                                  claim.created_at,
                                ).toLocaleString(dateLocale)}
                              />

                              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 md:col-span-2">
                                <p className="text-xs text-white/40">
                                  {translate(
                                    t,
                                    "verificationUrl",
                                    "URL de verificação",
                                  )}
                                </p>

                                <a
                                  href={claim.verification_url}
                                  target="_blank"
                                  className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-cyan-100 hover:text-cyan-200"
                                >
                                  <ExternalLink size={16} />
                                  {claim.verification_url}
                                </a>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-3 border-t border-white/10 bg-black/20 p-5">
                              <button
                                onClick={() => approveClaim(claim)}
                                disabled={actionLoading === claim.id}
                                className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-black text-black transition hover:scale-105 disabled:opacity-40"
                              >
                                <Check size={16} />
                                {actionLoading === claim.id
                                  ? translate(t, "approving", "Aprovando...")
                                  : translate(
                                      t,
                                      "adminApproveClaim",
                                      "Aprovar reivindicação",
                                    )}
                              </button>

                              <button
                                onClick={() => rejectClaim(claim)}
                                disabled={actionLoading === claim.id}
                                className="inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-300/10 px-5 py-3 text-sm font-bold text-red-100 transition hover:bg-red-300/20 disabled:opacity-40"
                              >
                                <X size={16} />
                                {actionLoading === claim.id
                                  ? translate(t, "processing", "Processando...")
                                  : translate(t, "reject", "Rejeitar")}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!loading && activeTab === "logs" && (
              <div className="mt-8">
                <SearchInput
                  value={logSearch}
                  onChange={setLogSearch}
                  placeholder={translate(
                    t,
                    "adminSearchLogsPlaceholder",
                    "Buscar logs por ação, usuário ou metadata...",
                  )}
                />

                <div className="mt-5 grid gap-3">
                  {filteredLogs.length === 0 && (
                    <EmptyBox
                      text={translate(
                        t,
                        "adminNoLogsFound",
                        "Nenhum log encontrado.",
                      )}
                    />
                  )}

                  {filteredLogs.map((log) => {
                    const admin = getOwner(log.admin_id);
                    const isExpanded = expandedLogs[log.id] ?? false;

                    return (
                      <div
                        key={log.id}
                        className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]"
                      >
                        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="flex items-center gap-2 font-bold text-white">
                              <History size={16} />
                              {log.action}
                            </p>

                            <p className="mt-1 text-sm text-white/45">
                              {translate(t, "admin", "Admin")}:{" "}
                              {admin
                                ? admin.email || admin.display_name
                                : log.admin_id ||
                                  translate(t, "system", "Sistema")}
                            </p>

                            <p className="text-sm text-white/35">
                              {translate(t, "target", "Target")}:{" "}
                              {log.target_type}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/50">
                              {new Date(log.created_at).toLocaleString(
                                dateLocale,
                              )}
                            </span>

                            <button
                              onClick={() =>
                                setExpandedLogs((current) => ({
                                  ...current,
                                  [log.id]: !isExpanded,
                                }))
                              }
                              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white transition hover:bg-white/[0.08]"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp size={16} />
                                  {translate(t, "collapse", "Recolher")}
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={16} />
                                  {translate(t, "expand", "Expandir")}
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-white/10 bg-black/20 p-5">
                            <SmallInfo
                              label="Target ID"
                              value={
                                log.target_id ||
                                translate(t, "noTarget", "sem target")
                              }
                            />

                            <pre className="no-scrollbar mt-4 max-h-48 overflow-y-auto rounded-2xl bg-black/30 p-3 text-xs text-white/45">
                              {JSON.stringify(log.metadata || {}, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SearchInput({
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

function UserInfo({
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

function StatusPill({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "cyan" | "yellow";
}) {
  const toneClass =
    tone === "cyan"
      ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
      : tone === "yellow"
        ? "border-yellow-300/20 bg-yellow-300/10 text-yellow-100"
        : "border-white/10 bg-white/[0.04] text-white/60";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${toneClass}`}>
      {label}
    </span>
  );
}

function InfoBox({
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

function SmallInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-white/30">
        {label}
      </p>
      <p className="mt-1 truncate">{value}</p>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-white/60">
      {text}
    </div>
  );
}
