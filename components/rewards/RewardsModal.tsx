"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Gift, Loader2, Package, Sparkles, Timer, Trophy, X, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

type PackType = "common_pack" | "rare_pack" | "epic_pack" | "legendary_pack" | "random_pack";

type RewardStatus = {
  dailyReward: {
    claimed: boolean;
    claimedAt: string | null;
    packType: PackType | null;
    nextClaimAt: string | null;
  };
  activityReward: {
    minutesActive: number;
    xpGranted: number;
    rewardCycles: number;
    maxCycles: number;
    minutesPerCycle: number;
    xpPerCycle: number;
    nextRewardInMinutes: number;
    dailyLimitReached: boolean;
  };
  streak: {
    current: number;
  };
};

type ClaimDailyResponse = {
  ok: boolean;
  packType?: PackType;
  packName?: string;
  message?: string;
};

type TranslateFunction = (key: any) => string;

function translate(t: TranslateFunction, key: string, fallback: string) {
  const value = t(key);
  return value && value !== key ? value : fallback;
}

function getPackLabel(packType: PackType | null, t: TranslateFunction) {
  if (packType === "legendary_pack") return translate(t, "rewardPackLegendary", "Pacote Lendário");
  if (packType === "epic_pack") return translate(t, "rewardPackEpic", "Pacote Épico");
  if (packType === "rare_pack") return translate(t, "rewardPackRare", "Pacote Raro");
  if (packType === "random_pack") return translate(t, "rewardPackRandom", "Pacote Misterioso");
  return translate(t, "rewardPackCommon", "Pacote Comum");
}

function formatDateTime(value: string | null, language: "pt" | "en" | "es") {
  if (!value) return "--";

  const locale = language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function RewardsModal({
  open,
  onClose,
  onOpenPacks,
}: {
  open: boolean;
  onClose: () => void;
  onOpenPacks?: () => void;
}) {
  const { language, t } = useLanguage();
  const [status, setStatus] = useState<RewardStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const activityProgress = useMemo(() => {
    if (!status) return 0;
    const currentCycleMinutes = status.activityReward.minutesActive % status.activityReward.minutesPerCycle;
    return Math.min(100, Math.round((currentCycleMinutes / status.activityReward.minutesPerCycle) * 100));
  }, [status]);

  const loadStatus = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await fetch("/api/rewards/status", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) return;

      const result = (await response.json()) as RewardStatus;
      setStatus(result);
    } catch (error) {
      console.error("Erro ao carregar recompensas:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadStatus();
  }, [loadStatus, open]);

  async function claimDailyReward() {
    setClaiming(true);
    setMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await fetch("/api/rewards/claim-daily", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      const result = (await response.json()) as ClaimDailyResponse;

      if (!response.ok || !result.ok) {
        setMessage(result.message || translate(t, "rewardClaimError", "Não foi possível resgatar agora."));
        return;
      }

      setMessage(
        translate(t, "rewardClaimSuccess", "Pacote diário resgatado: {pack}.").replace(
          "{pack}",
          result.packName || getPackLabel(result.packType || "common_pack", t),
        ),
      );

      window.dispatchEvent(new Event("creator-nexus:packs-updated"));
      window.dispatchEvent(new Event("creator-nexus:notifications-updated"));

      await loadStatus();
    } catch (error) {
      console.error("Erro ao resgatar recompensa diária:", error);
      setMessage(translate(t, "rewardClaimError", "Não foi possível resgatar agora."));
    } finally {
      setClaiming(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/72 px-4 py-6 text-white backdrop-blur-xl">
      <div className="relative max-h-[min(760px,calc(100dvh-32px))] w-full max-w-3xl overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-zinc-950/95 shadow-[0_28px_120px_rgba(0,0,0,0.86),0_0_70px_rgba(34,211,238,0.12)]">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-fuchsia-600/15 blur-[100px]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:42px_42px] opacity-25" />

        <div className="relative z-10 flex items-start justify-between border-b border-white/10 p-5 sm:p-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100">
              <Sparkles size={13} />
              {translate(t, "rewardsEyebrow", "Central Cardpoc")}
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
              {translate(t, "rewardsTitle", "Recompensas diárias")}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/55">
              {translate(
                t,
                "rewardsDescription",
                "Resgate seu pacote diário e ganhe XP enquanto participa do Cardpoc.",
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label={translate(t, "closeRewards", "Fechar recompensas")}
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative z-10 max-h-[calc(100dvh-190px)] overflow-y-auto p-5 [scrollbar-width:none] [-ms-overflow-style:none] sm:p-6 [&::-webkit-scrollbar]:hidden">
          {loading && !status ? (
            <div className="flex min-h-72 items-center justify-center text-cyan-100">
              <Loader2 className="animate-spin" size={28} />
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.055] p-5">
                <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-cyan-300/20 blur-[58px]" />
                <div className="relative z-10 flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/25 bg-black/35 text-cyan-100 shadow-[0_0_34px_rgba(34,211,238,0.16)]">
                    <Package size={25} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100/70">
                      {translate(t, "dailyReward", "Recompensa diária")}
                    </p>
                    <h3 className="mt-1 text-xl font-black text-white">
                      {status?.dailyReward.claimed
                        ? translate(t, "dailyRewardClaimed", "Pacote já resgatado")
                        : translate(t, "dailyRewardAvailable", "Pacote disponível")}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/55">
                      {status?.dailyReward.claimed
                        ? translate(t, "dailyRewardNext", "Próximo resgate: {date}").replace(
                            "{date}",
                            formatDateTime(status.dailyReward.nextClaimAt, language),
                          )
                        : translate(t, "dailyRewardReady", "Seu pacote diário está pronto para resgate.")}
                    </p>

                    {message && (
                      <p className="mt-3 rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-bold text-cyan-100">
                        {message}
                      </p>
                    )}

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={claimDailyReward}
                        disabled={claiming || Boolean(status?.dailyReward.claimed)}
                        className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-black transition ${
                          status?.dailyReward.claimed
                            ? "cursor-not-allowed border border-white/10 bg-white/[0.04] text-white/35"
                            : "border border-cyan-200/35 bg-cyan-300/15 text-cyan-50 shadow-[0_0_28px_rgba(34,211,238,0.14)] hover:bg-cyan-300/25"
                        }`}
                      >
                        {claiming ? <Loader2 className="animate-spin" size={16} /> : <Gift size={16} />}
                        {status?.dailyReward.claimed
                          ? translate(t, "rewardAlreadyClaimed", "Já resgatado")
                          : translate(t, "claimDailyReward", "Resgatar pacote")}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenPacks?.();
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/75 transition hover:bg-white/[0.08] hover:text-white"
                      >
                        <Package size={16} />
                        {translate(t, "openMyPacks", "Abrir meus pacotes")}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-fuchsia-100/65">
                      {translate(t, "onlineXpReward", "XP online")}
                    </p>
                    <h3 className="mt-1 text-xl font-black text-white">
                      +{status?.activityReward.xpPerCycle ?? 25} XP
                    </h3>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/10 text-fuchsia-100">
                    <Zap size={22} />
                  </div>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-white/50">
                  {translate(t, "onlineXpDescription", "Ganhe XP a cada {minutes} minutos ativo no site.").replace(
                    "{minutes}",
                    String(status?.activityReward.minutesPerCycle ?? 20),
                  )}
                </p>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-yellow-200 shadow-[0_0_20px_rgba(34,211,238,0.35)] transition-all"
                    style={{ width: `${activityProgress}%` }}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-white/40">{translate(t, "activeMinutes", "Minutos ativos")}</p>
                    <p className="mt-1 font-black text-white">{status?.activityReward.minutesActive ?? 0}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-white/40">{translate(t, "dailyXp", "XP do dia")}</p>
                    <p className="mt-1 font-black text-white">{status?.activityReward.xpGranted ?? 0}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-white/40">{translate(t, "rewardCycles", "Ciclos")}</p>
                    <p className="mt-1 font-black text-white">
                      {status?.activityReward.rewardCycles ?? 0}/{status?.activityReward.maxCycles ?? 6}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-white/40">{translate(t, "nextXpReward", "Próximo XP")}</p>
                    <p className="mt-1 font-black text-white">
                      {status?.activityReward.dailyLimitReached
                        ? translate(t, "dailyLimitReached", "Limite")
                        : translate(t, "minutesShort", "{minutes} min").replace(
                            "{minutes}",
                            String(status?.activityReward.nextRewardInMinutes ?? 20),
                          )}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-yellow-300/15 bg-yellow-300/[0.045] p-5 lg:col-span-2">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-300/20 bg-yellow-300/10 text-yellow-100">
                      <Trophy size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">
                        {translate(t, "rewardStreakTitle", "Sequência diária")}
                      </p>
                      <p className="mt-1 text-sm text-white/50">
                        {translate(t, "rewardStreakDescription", "Resgate todos os dias para liberar bônus melhores nas próximas fases.")}
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-4 py-2 text-sm font-black text-yellow-100">
                    <Timer size={16} />
                    {translate(t, "streakDays", "{days} dia(s)").replace(
                      "{days}",
                      String(status?.streak.current ?? 0),
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
