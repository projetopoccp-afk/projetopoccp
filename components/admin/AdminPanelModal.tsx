"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ExternalLink, Search, ShieldCheck, UserCog, X } from "lucide-react";

import { supabase } from "@/lib/supabase/client";

type AdminPanelModalProps = {
  open: boolean;
  onClose: () => void;
};

type Tab = "requests" | "users";

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

export function AdminPanelModal({ open, onClose }: AdminPanelModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("requests");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [requests, setRequests] = useState<CreatorRequest[]>([]);
  const [users, setUsers] = useState<ProfileUser[]>([]);
  const [userSearch, setUserSearch] = useState("");

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

  async function loadPanel() {
    setLoading(true);
    await Promise.all([loadRequests(), loadUsers()]);
    setLoading(false);
  }

  useEffect(() => {
    if (open) {
      loadPanel();
    }
  }, [open]);

  async function approveRequest(request: CreatorRequest) {
    setActionLoading(request.id);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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
        reviewed_by: user.id,
      })
      .eq("id", request.id);

    await supabase.from("admin_logs").insert({
      admin_id: user.id,
      action: "approve_creator_request",
      target_type: "creator_request",
      target_id: request.id,
      metadata: {
        nickname: request.nickname,
        username: request.username,
        category: request.category,
        creator_profile_id: creatorProfile.id,
      },
    });

    setActionLoading(null);
    await loadRequests();
  }

  async function rejectRequest(request: CreatorRequest) {
    setActionLoading(request.id);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setActionLoading(null);
      return;
    }

    await supabase
      .from("creator_requests")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq("id", request.id);

    await supabase.from("admin_logs").insert({
      admin_id: user.id,
      action: "reject_creator_request",
      target_type: "creator_request",
      target_id: request.id,
      metadata: {
        nickname: request.nickname,
        username: request.username,
        category: request.category,
      },
    });

    setActionLoading(null);
    await loadRequests();
  }

  async function toggleAdmin(targetUser: ProfileUser) {
    setActionLoading(targetUser.id);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setActionLoading(null);
      return;
    }

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

    await supabase.from("admin_logs").insert({
      admin_id: user.id,
      action: newAdminValue ? "promote_user_admin" : "remove_user_admin",
      target_type: "profile",
      target_id: targetUser.id,
      metadata: {
        email: targetUser.email,
        display_name: targetUser.display_name,
        username: targetUser.username,
      },
    });

    setActionLoading(null);
    await loadUsers();
  }

  const filteredUsers = users.filter((user) => {
    const search = userSearch.toLowerCase().trim();

    const searchableText = [
      user.email,
      user.display_name,
      user.username,
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
            className="no-scrollbar relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[32px] border border-white/15 bg-zinc-950 p-6 text-white shadow-[0_0_80px_rgba(0,0,0,0.9)] md:p-8"
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
              Gerencie solicitações e usuários da plataforma.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab("requests")}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  activeTab === "requests"
                    ? "bg-cyan-300 text-black"
                    : "border border-white/10 bg-white/[0.04] text-white/60"
                }`}
              >
                Requests
              </button>

              <button
                onClick={() => setActiveTab("users")}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  activeTab === "users"
                    ? "bg-cyan-300 text-black"
                    : "border border-white/10 bg-white/[0.04] text-white/60"
                }`}
              >
                Users
              </button>
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
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">
                            {request.status}
                          </p>

                          <h3 className="mt-2 text-2xl font-black">
                            {request.nickname}
                          </h3>

                          <p className="text-white/45">@{request.username}</p>

                          <p className="mt-1 text-sm text-white/40">
                            {request.email}
                          </p>
                        </div>

                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-white/60">
                          {new Date(request.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>

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
                          className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-black text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Check size={16} />
                          {actionLoading === request.id
                            ? "Aprovando..."
                            : "Aprovar"}
                        </button>

                        <button
                          onClick={() => rejectRequest(request)}
                          disabled={actionLoading === request.id}
                          className="inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-300/10 px-5 py-3 text-sm font-bold text-red-100 transition hover:bg-red-300/20 disabled:cursor-not-allowed disabled:opacity-40"
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
                <div className="relative">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                  />

                  <input
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    placeholder="Buscar por nome, username ou email..."
                    className="w-full rounded-full border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-cyan-300/40"
                  />
                </div>

                <div className="mt-5 grid gap-4">
                  {filteredUsers.length === 0 && (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-white/60">
                      Nenhum usuário encontrado.
                    </div>
                  )}

                  {filteredUsers.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
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

                      <div className="flex flex-wrap items-center gap-3">
                        {profile.is_admin && (
                          <span className="rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-1 text-xs text-yellow-100">
                            Admin
                          </span>
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
                          {profile.is_admin ? "Remover Admin" : "Tornar Admin"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}