"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gift,
  History,
  Loader2,
  Package,
  Percent,
  Radio,
  RefreshCw,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";

import { CardpocModalShell } from "@/components/ui/CardpocModalShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/i18n/translate";
import { supabase } from "@/lib/supabase/client";

type LiveDropsModalProps = {
  open: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
  platform: "kick";
  isLive: boolean;
  viewerCount: number;
  liveTitle?: string | null;
};

type RewardType = "xp" | "random_pack";

type DurationMinutes = 5 | 10 | 30;

type DropRecord = {
  id: string;
  creator_id: string;
  platform: string;
  keyword: string;
  reward_type: string;
  viewer_count_at_start: number;
  drop_percentage: number;
  max_claims: number;
  current_claims: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
};

const DROP_PERCENTAGE = 15;
const DEFAULT_KEYWORD = "CARDPOC";

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function isDropCurrentlyActive(drop: DropRecord) {
  return drop.is_active && new Date(drop.ends_at).getTime() > Date.now();
}

function getRewardLabel(t: Parameters<typeof translate>[0], rewardType: string) {
  if (rewardType === "xp") return translate(t, "liveDropsRewardXp", "XP");
  if (rewardType === "random_pack") {
    return translate(t, "liveDropsRewardRandomPack", "Pack Aleatório");
  }

  return rewardType;
}

export function LiveDropsModal({
  open,
  onClose,
  creatorId,
  creatorName,
  platform,
  isLive,
  viewerCount,
  liveTitle,
}: LiveDropsModalProps) {
  const { t } = useLanguage();
  const [rewardType, setRewardType] = useState<RewardType>("random_pack");
  const [durationMinutes, setDurationMinutes] = useState<DurationMinutes>(10);
  const [saving, setSaving] = useState(false);
  const [loadingDrops, setLoadingDrops] = useState(false);
  const [endingDropId, setEndingDropId] = useState<string | null>(null);
  const [drops, setDrops] = useState<DropRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const normalizedViewerCount = Math.max(0, Math.floor(Number(viewerCount) || 0));
  const maxClaims = useMemo(() => {
    if (!isLive || normalizedViewerCount <= 0) return 0;
    return Math.max(1, Math.floor(normalizedViewerCount * (DROP_PERCENTAGE / 100)));
  }, [isLive, normalizedViewerCount]);

  const activeDrops = useMemo(() => drops.filter(isDropCurrentlyActive), [drops]);
  const historyDrops = useMemo(() => drops.filter((drop) => !isDropCurrentlyActive(drop)), [drops]);

  const canActivate = isLive && normalizedViewerCount > 0 && maxClaims > 0 && !saving;

  const getSessionAccessToken = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("missing_session");
    }

    return session.access_token;
  }, []);

  const loadDrops = useCallback(async () => {
    if (!open || !creatorId) return;

    setLoadingDrops(true);
    setError(null);

    try {
      const accessToken = await getSessionAccessToken();

      const response = await fetch("/api/drops/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          creatorId,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "drops_list_failed");
      }

      const payload = (await response.json()) as { drops?: DropRecord[] };
      setDrops(payload.drops || []);
    } catch (dropsError) {
      console.error("Erro ao carregar drops:", dropsError);
      setError(
        translate(
          t,
          "liveDropsListError",
          "Não foi possível carregar os drops agora.",
        ),
      );
    } finally {
      setLoadingDrops(false);
    }
  }, [creatorId, getSessionAccessToken, open, t]);

  useEffect(() => {
    if (!open) return;
    void loadDrops();
  }, [loadDrops, open]);

  async function handleActivateDrop() {
    if (!canActivate) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const accessToken = await getSessionAccessToken();

      const response = await fetch("/api/drops/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          creatorId,
          platform,
          keyword: DEFAULT_KEYWORD,
          rewardType,
          durationMinutes,
          viewerCount: normalizedViewerCount,
          dropPercentage: DROP_PERCENTAGE,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "drop_create_failed");
      }

      setSuccessMessage(
        translate(
          t,
          "liveDropsCreatedDescription",
          "Drop ativado com sucesso. Agora a próxima etapa é conectar a leitura do chat da Kick.",
        ),
      );
      await loadDrops();
    } catch (dropError) {
      console.error("Erro ao criar drop:", dropError);
      setError(
        translate(
          t,
          "liveDropsCreateError",
          "Não foi possível ativar o drop agora.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleEndDrop(dropId: string) {
    setEndingDropId(dropId);
    setError(null);
    setSuccessMessage(null);

    try {
      const accessToken = await getSessionAccessToken();

      const response = await fetch("/api/drops/end", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          creatorId,
          dropId,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "drop_end_failed");
      }

      setSuccessMessage(translate(t, "liveDropsEnded", "Drop encerrado com sucesso."));
      await loadDrops();
    } catch (endError) {
      console.error("Erro ao encerrar drop:", endError);
      setError(
        translate(
          t,
          "liveDropsEndError",
          "Não foi possível encerrar o drop agora.",
        ),
      );
    } finally {
      setEndingDropId(null);
    }
  }

  if (!open) return null;

  return (
    <CardpocModalShell
      onClose={onClose}
      showCloseButton
      closeLabel={translate(t, "liveDropsClose", "Fechar drops de live")}
      className="max-w-6xl"
      contentClassName="max-h-[calc(100dvh-1rem)] overflow-y-auto p-5 sm:p-7 lg:p-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.12)]">
          <Gift className="h-4 w-4" />
          {translate(t, "liveDropsEyebrow", "Drops de Live")}
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-[28px] border border-white/10 bg-black/25 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-6">
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {translate(t, "liveDropsTitle", "Ativar drop para a live")}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
              {translate(
                t,
                "liveDropsDescription",
                "O Cardpoc usa 15% dos espectadores atuais da live como limite máximo de recompensas deste drop.",
              )}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white/45">
                  <Radio className={isLive ? "h-4 w-4 text-red-200" : "h-4 w-4 text-white/35"} />
                  {translate(t, "liveDropsLiveStatus", "Status")}
                </div>
                <p className={isLive ? "mt-3 text-lg font-black text-emerald-100" : "mt-3 text-lg font-black text-white/45"}>
                  {isLive
                    ? translate(t, "liveDropsOnline", "Ao vivo")
                    : translate(t, "liveDropsOffline", "Offline")}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white/45">
                  <Users className="h-4 w-4 text-cyan-100" />
                  {translate(t, "liveDropsViewersNow", "Viewers agora")}
                </div>
                <p className="mt-3 text-lg font-black text-cyan-50">
                  {formatNumber(normalizedViewerCount)}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-amber-100/70">
                  <Percent className="h-4 w-4 text-amber-100" />
                  {translate(t, "liveDropsPercentage", "Porcentagem")}
                </div>
                <p className="mt-3 text-lg font-black text-amber-50">{DROP_PERCENTAGE}%</p>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-emerald-300/20 bg-emerald-300/10 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-100/65">
                    {translate(t, "liveDropsAvailable", "Drops disponíveis")}
                  </p>
                  <p className="mt-2 text-4xl font-black text-emerald-50">
                    {formatNumber(maxClaims)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">Kick</p>
                  <p className="mt-1 max-w-[220px] truncate text-sm font-black text-white">
                    {creatorName}
                  </p>
                </div>
              </div>

              {liveTitle ? (
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-white/55">{liveTitle}</p>
              ) : null}
            </div>

            {!isLive ? (
              <div className="mt-5 flex gap-3 rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm leading-6 text-red-100/80">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                {translate(
                  t,
                  "liveDropsOfflineWarning",
                  "O criador precisa estar ao vivo na Kick para ativar drops.",
                )}
              </div>
            ) : normalizedViewerCount <= 0 ? (
              <div className="mt-5 flex gap-3 rounded-2xl border border-yellow-300/20 bg-yellow-500/10 p-4 text-sm leading-6 text-yellow-100/80">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                {translate(
                  t,
                  "liveDropsNoViewersWarning",
                  "Não foi possível confirmar espectadores na live agora.",
                )}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-white/45">
                    <Gift className="h-4 w-4 text-emerald-100" />
                    {translate(t, "liveDropsActiveTitle", "Drops ativos")}
                  </p>

                  <button
                    type="button"
                    onClick={() => void loadDrops()}
                    disabled={loadingDrops}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white/50 transition hover:bg-white/[0.06] disabled:opacity-50"
                  >
                    <RefreshCw className={loadingDrops ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
                    {translate(t, "liveDropsRefresh", "Atualizar")}
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {loadingDrops && drops.length === 0 ? (
                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/50">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {translate(t, "liveDropsLoading", "Carregando drops...")}
                    </div>
                  ) : activeDrops.length > 0 ? (
                    activeDrops.map((drop) => (
                      <article
                        key={drop.id}
                        className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-emerald-50">
                              {getRewardLabel(t, drop.reward_type)}
                            </p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-100/55">
                              {drop.keyword} · {formatNumber(drop.current_claims)} / {formatNumber(drop.max_claims)}
                            </p>
                          </div>

                          <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-100">
                            {translate(t, "liveDropsActiveStatus", "Ativo")}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-white/45">
                          <span>
                            {translate(t, "liveDropsEndsAt", "Termina")}: {formatDateTime(drop.ends_at)}
                          </span>

                          <button
                            type="button"
                            onClick={() => void handleEndDrop(drop.id)}
                            disabled={endingDropId === drop.id}
                            className="inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-500/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-red-100 transition hover:bg-red-500/15 disabled:opacity-50"
                          >
                            {endingDropId === drop.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5" />
                            )}
                            {translate(t, "liveDropsEnd", "Encerrar")}
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/45">
                      {translate(t, "liveDropsNoActive", "Nenhum drop ativo para este criador.")}
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-white/45">
                  <History className="h-4 w-4 text-cyan-100" />
                  {translate(t, "liveDropsHistoryTitle", "Últimos drops")}
                </p>

                <div className="mt-4 space-y-3">
                  {historyDrops.length > 0 ? (
                    historyDrops.slice(0, 6).map((drop) => (
                      <article
                        key={drop.id}
                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-white/80">
                              {getRewardLabel(t, drop.reward_type)}
                            </p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-white/35">
                              {formatNumber(drop.current_claims)} / {formatNumber(drop.max_claims)} · {formatDateTime(drop.created_at)}
                            </p>
                          </div>

                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-white/45">
                            {translate(t, "liveDropsClosedStatus", "Encerrado")}
                          </span>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/45">
                      {translate(t, "liveDropsNoHistory", "Nenhum drop encerrado ainda.")}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </section>

          <aside className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-white/45">
                <Sparkles className="h-4 w-4 text-fuchsia-100" />
                {translate(t, "liveDropsReward", "Recompensa")}
              </p>

              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  onClick={() => setRewardType("random_pack")}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                    rewardType === "random_pack"
                      ? "border-cyan-300/35 bg-cyan-300/12 text-cyan-50"
                      : "border-white/10 bg-black/20 text-white/60 hover:bg-white/[0.06]"
                  }`}
                >
                  <Package className="h-5 w-5 shrink-0" />
                  <span className="font-black">
                    {translate(t, "liveDropsRewardRandomPack", "Pack Aleatório")}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRewardType("xp")}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                    rewardType === "xp"
                      ? "border-fuchsia-300/35 bg-fuchsia-300/12 text-fuchsia-50"
                      : "border-white/10 bg-black/20 text-white/60 hover:bg-white/[0.06]"
                  }`}
                >
                  <Sparkles className="h-5 w-5 shrink-0" />
                  <span className="font-black">
                    {translate(t, "liveDropsRewardXp", "XP")}
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-6">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-white/45">
                <Clock className="h-4 w-4 text-amber-100" />
                {translate(t, "liveDropsDuration", "Duração")}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[5, 10, 30].map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => setDurationMinutes(minutes as DurationMinutes)}
                    className={`rounded-2xl border px-3 py-3 text-sm font-black transition ${
                      durationMinutes === minutes
                        ? "border-amber-300/35 bg-amber-300/12 text-amber-50"
                        : "border-white/10 bg-black/20 text-white/55 hover:bg-white/[0.06]"
                    }`}
                  >
                    {minutes} {translate(t, "liveDropsMinutes", "min")}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/35">
                {translate(t, "liveDropsKeyword", "Palavra-chave")}
              </p>
              <p className="mt-2 text-2xl font-black tracking-[0.18em] text-white">
                {DEFAULT_KEYWORD}
              </p>
              <p className="mt-2 text-xs leading-5 text-white/40">
                {translate(
                  t,
                  "liveDropsFutureNote",
                  "Nesta primeira versão o drop é criado; a leitura automática do chat entra na próxima etapa.",
                )}
              </p>
            </div>

            {successMessage ? (
              <div className="mt-5 flex gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-100/85">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                {successMessage}
              </div>
            ) : null}

            {error ? (
              <div className="mt-5 flex gap-3 rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm leading-6 text-red-100/85">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                {error}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleActivateDrop}
              disabled={!canActivate}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-amber-200/30 bg-amber-300/15 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-amber-50 transition hover:bg-amber-300/25 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
              {saving
                ? translate(t, "liveDropsActivating", "Ativando...")
                : translate(t, "liveDropsActivate", "Ativar drop")}
            </button>
          </aside>
        </div>
      </div>
    </CardpocModalShell>
  );
}
