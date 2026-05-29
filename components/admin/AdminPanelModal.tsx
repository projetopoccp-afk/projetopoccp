"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  History,
  Search,
  ShieldCheck,
  UserCog,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

type AdminPanelModalProps = {
  open: boolean;
  onClose: () => void;
};

type Tab = "requests" | "users" | "creators" | "logs";

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
  const [activeTab, setActiveTab] = useState<Tab>("requests");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [requests, setRequests] = useState<CreatorRequest[]>([]);
  const [users, setUsers] = useState<ProfileUser[]>([]);
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);

  const [userSearch, setUserSearch] = useState("");
  const [creatorSearch, setCreatorSearch] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [selectedOwners, setSelectedOwners] = useState<Record<string, string>>({});

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
      .select("id, email, display_name, username, avatar_url, is_admin, created_at")
      .order("created_at", { ascending: false });

    setUsers((data || []) as ProfileUser[]);
  }

  async function loadCreators() {
    const { data } = await supabase
      .from("creator_profiles")
      .select(
        "id, user_id, nickname, username, title, category, avatar_url, is_public, is_verified, owner_status, created_at"
      )
      .order("created_at", { ascending: false });

    setCreators((data || []) as CreatorProfile[]);
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
      loadLogs(),
    ]);

    setLoading(false);
  }

  useEffect(() => {
    if (open) {
      loadPanel();
    }
  }, [open]);

  function getOwner(profileId: string | null) {
    if (!profileId) return null;
    return users.find((user) => user.id === profileId) || null;
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
      alert(profileError?.message || "Erro ao criar creator profile.");
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
            aria-label="Fechar painel admin"
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
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-yellow-100">
              <ShieldCheck size={14} />
              Admin Panel
            </div>

            <h2 className="mt-6 text-3xl font-black">Painel Admin</h2>

            <p className="mt-2 text-sm text-white/50">
              Gerencie solicitações, usuários, creators e logs.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {(["requests", "users", "creators", "logs"] as Tab[]).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-full px-4 py-2 text-sm capitalize transition ${
                      activeTab === tab
                        ? "bg-cyan-300 text-black"
                        : "border border-white/10 bg-white/[0.04] text-white/60"
                    }`}
                  >
                    {tab}
                  </button>
                )
              )}
            </div>

            {loading && (
              <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-white/60">
                Carregando painel...
              </div>
            )}

            {!loading && activeTab === "requests" && (
              <div className="mt-8 grid gap-5">
                {requests.length === 0 && (
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-white/60">
                    Nenhuma solicitação pendente.
                  </div>
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
                          Sem imagem
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
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                          <p className="text-xs text-white/40">Plataforma</p>
                          <p className="mt-1 font-bold">
                            {request.verification_platform || "Não informado"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                          <p className="text-xs text-white/40">Código</p>
                          <p className="mt-1 font-bold tracking-[0.2em] text-cyan-100">
                            {request.verification_code}
                          </p>
                        </div>
                      </div>

                      {request.verification_url && (
                        <a
                          href={request.verification_url}
                          target="_blank"
                          className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-300/20"
                        >
                          <ExternalLink size={16} />
                          Abrir canal/perfil
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
                            ? "Aprovando..."
                            : "Aprovar"}
                        </button>

                        <button
                          onClick={() => rejectRequest(request)}
                          disabled={actionLoading === request.id}
                          className="inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-300/10 px-5 py-3 text-sm font-bold text-red-100 transition hover:bg-red-300/20 disabled:opacity-40"
                        >
                          <X size={16} />
                          {actionLoading === request.id
                            ? "Processando..."
                            : "Rejeitar"}
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
                  placeholder="Buscar por nome, username ou email..."
                />

                <div className="mt-5 grid gap-4">
                  {filteredUsers.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <UserInfo profile={profile} />

                      <button
                        onClick={() => toggleAdmin(profile)}
                        disabled={actionLoading === profile.id}
                        className={`rounded-full px-5 py-2 text-sm font-bold transition disabled:opacity-40 ${
                          profile.is_admin
                            ? "border border-red-300/20 bg-red-300/10 text-red-100 hover:bg-red-300/20"
                            : "bg-cyan-300 text-black hover:scale-105"
                        }`}
                      >
                        {profile.is_admin ? "Remover Admin" : "Tornar Admin"}
                      </button>
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
      placeholder="Buscar por creator, dono, email ou username..."
    />

    <div className="mt-5 grid gap-5">
      {filteredCreators.map((creator) => {
        const owner = getOwner(creator.user_id);
        const selectedOwnerId =
          selectedOwners[creator.id] ?? creator.user_id ?? "";

        return (
          <div
            key={creator.id}
            className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] backdrop-blur-xl"
          >
            <div className="grid gap-6 p-5 md:grid-cols-[140px_1fr]">
              <div className="aspect-[3/4] overflow-hidden rounded-3xl border border-white/10 bg-black/40">
                {creator.avatar_url ? (
                  <img
  src={creator.avatar_url}
  alt={creator.nickname}
  className="h-full w-full object-cover"
/>
                ) : (
                  <div className="flex h-44 items-center justify-center text-white/30">
                    Sem imagem
                  </div>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div>
                    <h3 className="text-3xl font-black text-white">
                      {creator.nickname}
                    </h3>

                    {creator.title && (
                      <p className="mt-1 text-sm font-semibold text-cyan-100">
                        {creator.title}
                      </p>
                    )}

                    <p className="mt-1 text-white/45">@{creator.username}</p>

                    <p className="mt-3 text-sm text-white/45">
                      Categoria:{" "}
                      <span className="text-white/70">
                        {creator.category || "Creator"}
                      </span>
                    </p>
                  </div>

                  <div className="grid gap-2 text-right">
                    <StatusPill
                      label={creator.user_id ? "👤 Reivindicado" : "👤 Sem dono"}
                    />

                    <StatusPill
                      label={creator.is_verified ? "✓ Verificado" : "○ Não verificado"}
                    />

                    <StatusPill
                      label={creator.is_public ? "🌐 Público" : "🔒 Oculto"}
                    />
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-white/10 bg-black/25 p-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/35">
                    Dono atual
                  </p>

                  {owner ? (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                        {owner.avatar_url ? (
                          <img
                            src={owner.avatar_url}
                            alt={owner.display_name || "Owner"}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>

                      <div>
                        <p className="text-sm font-bold text-white">
                          {owner.display_name || "Sem nome"}
                        </p>

                        <p className="text-xs text-white/45">
                          {owner.email || "sem email"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-white/45">
                      Este perfil ainda não possui proprietário.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 border-t border-white/10 p-5 md:grid-cols-2">
              <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
                <h4 className="font-bold text-white">
                  Gerenciamento do proprietário
                </h4>

                <p className="mt-2 text-sm text-white/45">
                  Atribua este perfil a um usuário logado ou remova o dono atual.
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
                  <option value="">Sem dono</option>

                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email || user.display_name || user.id}
                    </option>
                  ))}
                </select>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => changeCreatorOwner(creator, selectedOwnerId)}
                    disabled={actionLoading === creator.id}
                    className="rounded-full bg-cyan-300 px-5 py-2 text-sm font-black text-black transition hover:scale-105 disabled:opacity-40"
                  >
                    Atribuir proprietário
                  </button>

                  <button
                    onClick={() => removeCreatorOwner(creator)}
                    disabled={actionLoading === creator.id || !creator.user_id}
                    className="rounded-full border border-red-300/20 bg-red-300/10 px-5 py-2 text-sm font-bold text-red-100 transition hover:bg-red-300/20 disabled:opacity-40"
                  >
                    Remover dono
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-purple-300/15 bg-purple-300/[0.04] p-5">
                <h4 className="font-bold text-white">Ações rápidas</h4>

                <p className="mt-2 text-sm text-white/45">
                  Controle visibilidade e validação pública do creator.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => toggleCreatorVerified(creator)}
                    disabled={actionLoading === creator.id}
                    className="rounded-full border border-yellow-300/20 bg-yellow-300/10 px-5 py-2 text-sm font-bold text-yellow-100 transition hover:bg-yellow-300/20 disabled:opacity-40"
                  >
                    {creator.is_verified
                      ? "Remover verificação"
                      : "Verificar perfil"}
                  </button>

                  <button
                    onClick={() => toggleCreatorPublic(creator)}
                    disabled={actionLoading === creator.id}
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/20 disabled:opacity-40"
                  >
                    {creator.is_public ? (
                      <>
                        <EyeOff size={16} />
                        Ocultar perfil
                      </>
                    ) : (
                      <>
                        <Eye size={16} />
                        Publicar perfil
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-3 border-t border-white/10 bg-black/20 p-5 text-sm text-white/45 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                  ID
                </p>
                <p className="mt-1 truncate">{creator.id}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                  Criado em
                </p>
                <p className="mt-1">
                  {new Date(creator.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                  Username
                </p>
                <p className="mt-1">@{creator.username}</p>
              </div>
            </div>
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
                  placeholder="Buscar logs por ação, usuário ou metadata..."
                />

                <div className="mt-5 grid gap-3">
                  {filteredLogs.map((log) => {
                    const admin = getOwner(log.admin_id);

                    return (
                      <div
                        key={log.id}
                        className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="flex items-center gap-2 font-bold text-white">
                              <History size={16} />
                              {log.action}
                            </p>

                            <p className="mt-1 text-sm text-white/45">
                              Admin:{" "}
                              {admin
                                ? admin.email || admin.display_name
                                : log.admin_id || "Sistema"}
                            </p>

                            <p className="text-sm text-white/35">
                              Target: {log.target_type} •{" "}
                              {log.target_id || "sem target"}
                            </p>
                          </div>

                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/50">
                            {new Date(log.created_at).toLocaleString("pt-BR")}
                          </span>
                        </div>

                        <pre className="no-scrollbar mt-4 max-h-32 overflow-y-auto rounded-2xl bg-black/30 p-3 text-xs text-white/45">
                          {JSON.stringify(log.metadata || {}, null, 2)}
                        </pre>
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

function UserInfo({ profile }: { profile: ProfileUser }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name || "Avatar"}
            className="h-full w-full object-cover"
          />
        ) : (
          <UserCog className="text-white/35" />
        )}
      </div>

      <div>
        <p className="font-bold text-white">
          {profile.display_name || "Sem nome"}
        </p>

        <p className="text-sm text-white/45">
          {profile.email || "sem email"}
        </p>

        <p className="text-xs text-white/35">
          @{profile.username || "sem_username"}
        </p>
      </div>
    </div>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60">
      {label}
    </span>
  );
}