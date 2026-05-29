"use client";

import { useEffect, useState } from "react";
import { Check, ExternalLink, ShieldCheck, X } from "lucide-react";

import { supabase } from "@/lib/supabase/client";

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

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState<CreatorRequest[]>([]);

  async function loadAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/";
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setIsAdmin(true);

    const { data } = await supabase
      .from("creator_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    setRequests((data || []) as CreatorRequest[]);
    setLoading(false);
  }

  useEffect(() => {
    loadAdmin();
  }, []);

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

    const { error: updateError } = await supabase
      .from("creator_requests")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq("id", request.id);

    if (updateError) {
      setActionLoading(null);
      alert(updateError.message);
      return;
    }

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
    await loadAdmin();
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

    const { error } = await supabase
      .from("creator_requests")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq("id", request.id);

    if (error) {
      setActionLoading(null);
      alert(error.message);
      return;
    }

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
    await loadAdmin();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        Carregando painel admin...
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="max-w-md rounded-3xl border border-red-300/20 bg-red-300/10 p-8 text-center">
          <h1 className="text-2xl font-black">Acesso negado</h1>

          <p className="mt-3 text-white/60">
            Esta área é restrita para administradores.
          </p>

          <a
            href="/"
            className="mt-6 inline-block rounded-full bg-white px-5 py-2 text-sm font-bold text-black"
          >
            Voltar para home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.16),transparent_35%)]" />

      <section className="relative z-10 mx-auto max-w-6xl">
        <a href="/" className="text-sm text-cyan-200 hover:text-cyan-100">
          ← Voltar para home
        </a>

        <div className="mt-8 flex items-center gap-3">
          <ShieldCheck className="text-cyan-200" />

          <h1 className="text-4xl font-black">Painel Admin</h1>
        </div>

        <p className="mt-3 text-white/50">
          Solicitações pendentes de aprovação.
        </p>

        <div className="mt-8 grid gap-5">
          {requests.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-white/60">
              Nenhuma solicitação pendente.
            </div>
          )}

          {requests.map((request) => (
            <div
              key={request.id}
              className="grid gap-5 rounded-[32px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl md:grid-cols-[180px_1fr]"
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

                    <h2 className="mt-2 text-2xl font-black">
                      {request.nickname}
                    </h2>

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
                    {actionLoading === request.id ? "Aprovando..." : "Aprovar"}
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
      </section>
    </main>
  );
}